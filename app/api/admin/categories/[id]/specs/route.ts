import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { categorySpecs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { randomUUID } from "crypto";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET — list specs for a category
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const specs = await db.select().from(categorySpecs).where(eq(categorySpecs.categoryId, id)).orderBy(categorySpecs.sortOrder);
  return NextResponse.json(specs);
}

// POST — add a spec to a category
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { specKey, label, unit, isRequired } = body;
  if (!specKey || !label) return NextResponse.json({ error: "specKey e label são obrigatórios" }, { status: 400 });

  // Get next sort order
  const existing = await db.select().from(categorySpecs).where(eq(categorySpecs.categoryId, id));
  const sortOrder = existing.length;

  const newId = randomUUID();
  await db.insert(categorySpecs).values({
    id: newId,
    categoryId: id,
    specKey,
    label,
    unit: unit || null,
    isRequired: isRequired ?? false,
    sortOrder,
  });
  return NextResponse.json({ id: newId, ok: true });
}
