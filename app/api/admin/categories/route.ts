import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { randomUUID } from "crypto";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// POST — create category
export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { name, slug, description, isActive } = body;
  if (!name || !slug) return NextResponse.json({ error: "name e slug são obrigatórios" }, { status: 400 });

  const id = randomUUID();
  await db.insert(categories).values({
    id,
    name,
    slug,
    description: description || null,
    isActive: isActive ?? true,
  });
  return NextResponse.json({ id, ok: true });
}

// GET — list all categories
export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const cats = await db.select().from(categories).orderBy(categories.name);
  return NextResponse.json(cats);
}
