import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { listings, listingImages, listingSpecs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7701901038:AAEn9m2rGVSoOa0eQe_vamvnWNV2bDC8VNk";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Allowed Telegram user IDs (only Rodrigo can post)
const ALLOWED_TG_IDS = process.env.TELEGRAM_ALLOWED_IDS
  ? process.env.TELEGRAM_ALLOWED_IDS.split(",").map((s) => s.trim())
  : [];

async function downloadTelegramFile(fileId: string): Promise<{ url: string; buffer: Buffer }> {
  // Get file path from Telegram
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok) throw new Error("Failed to get file path from Telegram");
  
  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  
  // Download the file
  const imgRes = await fetch(downloadUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  
  return { url: downloadUrl, buffer };
}

async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  // Upload via the Manus storage proxy
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: "image/jpeg" }), filename);
  
  const uploadRes = await fetch(`${process.env.BUILT_IN_FORGE_API_URL || ""}/api/v1/storage/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY || ""}`,
    },
    body: formData,
  });
  
  if (!uploadRes.ok) {
    // Fallback: store as base64 data URL (temporary)
    const base64 = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  }
  
  const data = await uploadRes.json();
  return data.url || data.key || `data:image/jpeg;base64,${buffer.toString("base64")}`;
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
    const [existing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.slug, slug)).limit(1);
    if (!existing) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    
    // Verify this is from an allowed user
    const tgUser = update.message?.from;
    if (!tgUser) {
      return NextResponse.json({ ok: true });
    }

    // Check if user is allowed (if ALLOWED_IDS is set)
    if (ALLOWED_TG_IDS.length > 0 && !ALLOWED_TG_IDS.includes(String(tgUser.id))) {
      // Send rejection message
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: "Você não tem permissão para usar este bot.",
        }),
      });
      return NextResponse.json({ ok: true });
    }

    const msg = update.message;
    const chatId = msg.chat.id;

    // Handle /start command
    if (msg.text === "/start") {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Bot Rodrigometal ativo! 📸\n\nMande uma foto com uma descrição que eu cadastro o anúncio no site automaticamente.\n\nExemplo: mande uma foto de um redutor e escreva na legenda:\n\"Redutor Falk 1100, 1200 HP, relação 1:2.6, bom estado\"",
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (msg.text === "/help") {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Como usar:\n\n1. Tire ou escolha uma foto do equipamento\n2. Escreva a descrição na legenda da foto\n3. Envie\n\nO anúncio é criado automaticamente no site. Você pode editar depois no painel.",
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // Check if message has a photo
    if (!msg.photo || msg.photo.length === 0) {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Mande uma foto com a descrição na legenda. 📸",
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // Get the highest resolution photo
    const photo = msg.photo[msg.photo.length - 1];
    const caption = msg.caption || "Sem descrição";

    // Find or create the user (Rodrigo)
    let [user] = await db.select().from(users).where(eq(users.email, "rodrigocamargorodrigues@gmail.com")).limit(1);
    if (!user) {
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        phoneE164: "+5511999999999",
        email: "rodrigocamargorodrigues@gmail.com",
        name: "Rodrigo Metal",
        companyName: "Rodrigometal",
        slug: "rodrigo-metal",
        city: "Guarulhos",
        state: "SP",
        role: "admin",
        isActive: true,
      });
      [user] = await db.select().from(users).where(eq(users.email, "rodrigocamargorodrigues@gmail.com")).limit(1);
    }

    // Download and upload the photo
    const { buffer } = await downloadTelegramFile(photo.file_id);
    const filename = `telegram-${Date.now()}.jpg`;
    const imageUrl = await uploadToStorage(buffer, filename);

    // Create the listing
    const title = caption.split("\n")[0].slice(0, 300) || "Equipamento industrial";
    const baseSlug = slugify(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const listingId = randomUUID();
    await db.insert(listings).values({
      id: listingId,
      userId: user.id,
      slug,
      title,
      description: caption,
      city: user.city,
      state: user.state,
      priceOnRequest: true,
      itemCondition: "used_good",
      status: "active",
      source: "telegram",
      rawInput: caption,
    });

    // Add the image
    await db.insert(listingImages).values({
      id: randomUUID(),
      listingId,
      url: imageUrl,
      sortOrder: 0,
      altText: title,
    });

    // Revalidate
    revalidatePath("/");
    revalidatePath(`/anuncio/${slug}`);

    // Send confirmation to Telegram
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rodrigometal.vercel.app";
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Anúncio criado!\n\n${title}\n\nLink: ${siteUrl}/anuncio/${slug}\n\nPara editar: ${siteUrl}/admin/anuncios/${listingId}`,
        parse_mode: "HTML",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

// Telegram webhook verification
export async function GET() {
  return NextResponse.json({ ok: true, status: "Telegram webhook active" });
}
