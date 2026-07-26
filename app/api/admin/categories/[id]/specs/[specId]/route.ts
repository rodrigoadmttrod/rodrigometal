import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { categorySpecs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT — update a spec
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { specId } = await params;
  const body = await req.json();
  const { specKey, label, unit, isRequired } = body;

  await db
    .update(categorySpecs)
    .set({
      ...(specKey && { specKey }),
      ...(label && { label }),
      unit: unit ?? undefined,
      ...(typeof isRequired === "boolean" && { isRequired }),
    })
    .where(eq(categorySpecs.id, specId));

  return NextResponse.json({ ok: true });
}

// DELETE — remove a spec
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { specId } = await params;
  await db.delete(categorySpecs).where(eq(categorySpecs.id, specId));
  return NextResponse.json({ ok: true });
}
