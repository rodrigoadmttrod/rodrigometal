import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { contactEvents, listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/** Registra clique no botão de WhatsApp (contact_events). Nunca deve bloquear o contato. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sellerId = typeof body.sellerId === "string" ? body.sellerId : null;
    if (!sellerId) return NextResponse.json({ ok: false }, { status: 400 });

    const listingId = typeof body.listingId === "string" ? body.listingId : null;

    await db.insert(contactEvents).values({
      id: randomUUID(),
      sellerId,
      listingId,
      sourcePage: typeof body.sourcePage === "string" ? body.sourcePage.slice(0, 255) : "unknown",
    });

    // Incrementa o cache contactCount no listing (contact_events é a fonte de verdade)
    if (listingId) {
      await db.update(listings)
        .set({ contactCount: sql`${listings.contactCount} + 1` })
        .where(eq(listings.id, listingId));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
