import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT — update category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { name, slug, description, isActive } = body;

  await db
    .update(categories)
    .set({
      ...(name && { name }),
      ...(slug && { slug }),
      description: description ?? undefined,
      ...(typeof isActive === "boolean" && { isActive }),
    })
    .where(eq(categories.id, id));

  return NextResponse.json({ ok: true });
}

// DELETE — delete category (only if no listings)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  // Soft delete: just deactivate
  await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}
