import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

export async function createUser(input: {
  name: string;
  companyName?: string;
  email: string;
  password: string;
  phone: string;
  city?: string;
  state?: string;
}) {
  // Verifica se e-mail já existe
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "E-mail já cadastrado" } as const;
  }

  const phoneE164 = toE164(input.phone);
  const [existingPhone] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phoneE164, phoneE164))
    .limit(1);

  if (existingPhone) {
    // Telefone já existe (possivelmente criado pelo bot na Fase 5).
    // Orienta o usuário a entrar na conta existente em vez de erro cru.
    return { ok: false, error: "Este telefone já tem conta. Entre com seu e-mail e senha — se não lembra a senha, recupere pelo WhatsApp.", code: "PHONE_EXISTS" } as const;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = randomUUID();
  const baseSlug = slugify(input.companyName || input.name);
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(users).values({
    id,
    name: input.name,
    companyName: input.companyName || null,
    email: input.email,
    passwordHash,
    phoneE164,
    city: input.city || null,
    state: input.state || null,
    slug,
    role: "seller",
    isVerified: false,
  });

  return { ok: true, userId: id } as const;
}
