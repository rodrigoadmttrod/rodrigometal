import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  await db
    .update(listings)
    .set({ shareCount: sql`${listings.shareCount} + 1` })
    .where(eq(listings.id, id));

  return NextResponse.json({ ok: true });
}
