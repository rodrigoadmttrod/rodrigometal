import { db } from "@/lib/db/client";
import { listings, listingImages, contactEvents } from "@/lib/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

export async function getDashboardListings(userId: string) {
  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      status: listings.status,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      city: listings.city,
      state: listings.state,
      viewCount: listings.viewCount,
      contactCount: listings.contactCount,
      createdAt: listings.createdAt,
      soldAt: listings.soldAt,
    })
    .from(listings)
    .where(eq(listings.userId, userId))
    .orderBy(desc(listings.createdAt));

  // Busca a primeira imagem de cada listing
  const listingIds = rows.map((r) => r.id);
  if (listingIds.length === 0) return [];

  const images = await db
    .select()
    .from(listingImages)
    .where(
      // drizzle-orm não tem IN direto, usamos or com eq
      listingIds.length === 1
        ? eq(listingImages.listingId, listingIds[0])
        : sql`${listingImages.listingId} IN (${sql.join(listingIds.map((id) => sql`${id}`), sql`,`)})`
    )
    .orderBy(listingImages.sortOrder);

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.listingId)) {
      imageMap.set(img.listingId, img.url);
    }
  }

  return rows.map((r) => ({
    ...r,
    coverUrl: imageMap.get(r.id) || null,
  }));
}

export async function getDashboardStats(userId: string) {
  const [active] = await db
    .select({ c: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "active")));

  const [paused] = await db
    .select({ c: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "paused")));

  const [sold] = await db
    .select({ c: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "sold")));

  const [draft] = await db
    .select({ c: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "draft")));

  const [archived] = await db
    .select({ c: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "archived")));

  const [totalViews] = await db
    .select({ total: sql<number>`COALESCE(SUM(${listings.viewCount}), 0)` })
    .from(listings)
    .where(eq(listings.userId, userId));

  const [totalContacts] = await db
    .select({ total: sql<number>`COALESCE(SUM(${listings.contactCount}), 0)` })
    .from(listings)
    .where(eq(listings.userId, userId));

  return {
    active: active?.c ?? 0,
    paused: paused?.c ?? 0,
    sold: sold?.c ?? 0,
    draft: draft?.c ?? 0,
    archived: archived?.c ?? 0,
    totalViews: Number(totalViews?.total ?? 0),
    totalContacts: Number(totalContacts?.total ?? 0),
  };
}
