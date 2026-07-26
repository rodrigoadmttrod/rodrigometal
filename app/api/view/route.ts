import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Incrementa viewCount do anúncio.
 * Chamado via sendBeacon do cliente (a página é estática/ISR, não roda server code por view).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const listingId = typeof body.listingId === "string" ? body.listingId : null;
    if (!listingId) return NextResponse.json({ ok: false }, { status: 400 });

    await db.update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, listingId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
