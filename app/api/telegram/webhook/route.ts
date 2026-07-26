import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { listings, listingImages, listingSpecs, users, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { uploadToR2 } from "@/lib/r2";
import { SITE } from "@/lib/site";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Only the owner's chat ID can use this bot
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID || "8791400518";

// In-memory buffer to group photos from the same media_group
const mediaGroupBuffer = new Map<
  string,
  { photos: string[]; caption: string; chatId: number; timer: ReturnType<typeof setTimeout> }
>();

// ─── Telegram helpers ──────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string, parseMode = "HTML") {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok) throw new Error("Failed to get file path from Telegram");
  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  const imgRes = await fetch(downloadUrl);
  return Buffer.from(await imgRes.arrayBuffer());
}

async function getFileAsBase64(fileId: string): Promise<string> {
  const buf = await downloadTelegramFile(fileId);
  return buf.toString("base64");
}

async function uploadPhoto(fileId: string): Promise<string | null> {
  try {
    const buf = await downloadTelegramFile(fileId);
    const r2Url = await uploadToR2(buf, "image/jpeg", "jpg");
    if (r2Url) return r2Url;
    // Fallback: use Telegram CDN URL (temporary but works for preview)
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (fileData.ok) {
      return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
    }
    return null;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 250);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (true) {
    const [existing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${base}-${suffix++}`;
  }
}

// ─── AI Vision: analyze photos + caption ──────────────────────────────────

interface ListingDraft {
  title: string;
  description: string;
  categorySlug: string;
  itemCondition: "new" | "used_good" | "used_fair" | "scrap";
  price: number | null;
  priceOnRequest: boolean;
  specs: { key: string; value: string; unit?: string }[];
}

const CATEGORY_SLUGS = [
  "sucata-metalica", "maquinas", "redutores", "motores-eletricos",
  "bombas", "ventiladores", "caldeiras", "rolamentos", "equipamentos-industriais",
] as const;

async function analyzeWithAI(photoBase64List: string[], caption: string): Promise<ListingDraft> {
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL || "";
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || "";

  const imageParts = photoBase64List.slice(0, 4).map((b64) => ({
    type: "image_url" as const,
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));

  const systemPrompt = `Você é um especialista em equipamentos industriais brasileiros.
Analise as fotos e o texto fornecido pelo vendedor e extraia as informações para criar um anúncio de marketplace industrial.
Categorias disponíveis: ${CATEGORY_SLUGS.join(", ")}
Retorne APENAS um JSON válido com este schema:
{"title":"string (máx 120 chars, específico: marca+modelo+spec principal)","description":"string (2-4 parágrafos, combine plaqueta+texto, sem repetir título)","categorySlug":"string","itemCondition":"used_good|used_fair|scrap|new","price":number|null,"priceOnRequest":boolean,"specs":[{"key":"string","value":"string","unit":"string opcional"}]}
Para specs, extraia da plaqueta: marca, modelo, potência, tensão, corrente, rotação, relação de redução, frequência, IP, classe de isolamento, peso, fabricante, ano, etc.
Se o texto mencionar preço, extraia em "price" (número em reais). Se não houver preço claro, use price:null e priceOnRequest:true.`;

  const userContent = [
    ...imageParts,
    { type: "text" as const, text: caption ? `Texto do vendedor: "${caption}"` : "O vendedor não forneceu descrição. Use apenas as fotos." },
  ];

  const response = await fetch(`${forgeUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${forgeKey}` },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error(`LLM error: ${response.status} ${await response.text()}`);

  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}") as ListingDraft;

  if (!CATEGORY_SLUGS.includes(parsed.categorySlug as any)) parsed.categorySlug = "equipamentos-industriais";
  if (!["new", "used_good", "used_fair", "scrap"].includes(parsed.itemCondition)) parsed.itemCondition = "used_good";
  if (!parsed.title) parsed.title = "Equipamento industrial";
  if (!parsed.description) parsed.description = caption || "Equipamento industrial usado.";
  if (!parsed.specs) parsed.specs = [];

  return parsed;
}

// ─── Core: process a complete message (photos + caption) ──────────────────

async function processListing(chatId: number, photoFileIds: string[], caption: string) {
  await sendMessage(chatId, "⏳ Analisando as fotos com IA...");

  const base64Photos = await Promise.all(photoFileIds.slice(0, 4).map((id) => getFileAsBase64(id)));
  const draft = await analyzeWithAI(base64Photos, caption);

  const [ownerUser] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!ownerUser) {
    await sendMessage(chatId, "❌ Usuário administrador não encontrado. Configure sua conta no painel primeiro.");
    return;
  }

  const [category] = await db.select().from(categories).where(eq(categories.slug, draft.categorySlug)).limit(1);

  await sendMessage(chatId, "📤 Enviando fotos...");
  const uploadedUrls = await Promise.all(photoFileIds.map((id) => uploadPhoto(id)));
  const validUrls = uploadedUrls.filter(Boolean) as string[];

  const baseSlug = slugify(draft.title);
  const slug = await ensureUniqueSlug(baseSlug || `equipamento-${Date.now()}`);
  const listingId = randomUUID();

  await db.insert(listings).values({
    id: listingId,
    userId: ownerUser.id,
    categoryId: category?.id ?? null,
    slug,
    title: draft.title.slice(0, 300),
    description: draft.description.slice(0, 5000),
    city: ownerUser.city ?? "Guarulhos",
    state: ownerUser.state ?? "SP",
    price: draft.price ? String(draft.price) : null,
    priceOnRequest: draft.price ? false : true,
    itemCondition: draft.itemCondition,
    status: "draft",
    source: "telegram",
    rawInput: caption || null,
  });

  for (let i = 0; i < validUrls.length; i++) {
    await db.insert(listingImages).values({ id: randomUUID(), listingId, url: validUrls[i], sortOrder: i, altText: draft.title });
  }

  for (const spec of draft.specs.slice(0, 20)) {
    if (spec.key && spec.value) {
      await db.insert(listingSpecs).values({ id: randomUUID(), listingId, specKey: spec.key.slice(0, 100), value: spec.value.slice(0, 300), unit: spec.unit?.slice(0, 50) ?? null });
    }
  }

  revalidatePath("/");
  revalidatePath("/painel");

  const editUrl = `${SITE.url}/painel/anuncio/${listingId}/editar`;
  const specsText = draft.specs.length > 0
    ? "\n\n📋 <b>Specs extraídas:</b>\n" + draft.specs.slice(0, 8).map((s) => `• ${s.key}: ${s.value}${s.unit ? " " + s.unit : ""}`).join("\n")
    : "";
  const priceText = draft.price ? `\n💰 Preço: R$ ${draft.price.toLocaleString("pt-BR")}` : "\n💰 Preço: a combinar";

  await sendMessage(chatId,
    `✅ <b>Rascunho criado!</b>\n\n📦 <b>${draft.title}</b>\n🏷️ Categoria: ${draft.categorySlug}${priceText}${specsText}\n\n✏️ <b>Revise e publique:</b>\n${editUrl}`
  );
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId: number = msg.chat.id;
    const fromId = String(msg.from?.id ?? "");

    if (fromId !== OWNER_CHAT_ID) {
      await sendMessage(chatId, "Você não tem permissão para usar este bot.");
      return NextResponse.json({ ok: true });
    }

    if (msg.text === "/start") {
      await sendMessage(chatId,
        "🤖 <b>Bot Rodrigometal ativo!</b>\n\nMande fotos do equipamento (pode mandar várias de uma vez) com uma descrição na legenda.\n\nA IA vai ler as plaquetas, extrair as especificações e criar o rascunho automaticamente.\n\nVocê recebe o link para revisar e publicar no painel.\n\nExemplo de legenda:\n<i>\"Redutor FLENDER, bom estado, retirado de esteira em 2023\"</i>"
      );
      return NextResponse.json({ ok: true });
    }

    if (msg.text === "/help") {
      await sendMessage(chatId,
        "📖 <b>Como usar:</b>\n\n1. Tire fotos do equipamento (plaqueta + vista geral)\n2. Selecione todas as fotos de uma vez\n3. Escreva uma descrição na legenda\n4. Envie\n\nA IA lê as plaquetas e complementa com sua descrição.\nO rascunho é criado automaticamente — você só revisa e publica."
      );
      return NextResponse.json({ ok: true });
    }

    if (!msg.photo) {
      await sendMessage(chatId, "📸 Mande uma ou mais fotos do equipamento com a descrição na legenda.");
      return NextResponse.json({ ok: true });
    }

    const photo = msg.photo[msg.photo.length - 1];
    if (!photo) return NextResponse.json({ ok: true });

    const caption = msg.caption || "";
    const mediaGroupId: string | undefined = msg.media_group_id;

    if (mediaGroupId) {
      const existing = mediaGroupBuffer.get(mediaGroupId);
      if (existing) {
        existing.photos.push(photo.file_id);
        if (caption && !existing.caption) existing.caption = caption;
        clearTimeout(existing.timer);
        existing.timer = setTimeout(async () => {
          const group = mediaGroupBuffer.get(mediaGroupId);
          if (group) {
            mediaGroupBuffer.delete(mediaGroupId);
            await processListing(chatId, group.photos, group.caption);
          }
        }, 2500);
      } else {
        const timer = setTimeout(async () => {
          const group = mediaGroupBuffer.get(mediaGroupId);
          if (group) {
            mediaGroupBuffer.delete(mediaGroupId);
            await processListing(chatId, group.photos, group.caption);
          }
        }, 2500);
        mediaGroupBuffer.set(mediaGroupId, { photos: [photo.file_id], caption, chatId, timer });
      }
    } else {
      await processListing(chatId, [photo.file_id], caption);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "Telegram webhook active" });
}
