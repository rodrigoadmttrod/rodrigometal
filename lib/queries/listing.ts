import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  categories,
  listingImages,
  listingSpecs,
  listings,
  users,
} from "@/lib/db/schema";

/** Página do anúncio: dados completos + vendedor + specs + imagens + similares.
 *  Anúncios vendidos continuam acessíveis (nunca 404) — spec seção "prova de giro". */
export async function getListingBySlug(slug: string) {
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      description: listings.description,
      city: listings.city,
      state: listings.state,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      itemCondition: listings.itemCondition,
      status: listings.status,
      soldAt: listings.soldAt,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
      categoryId: listings.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      sellerId: users.id,
      sellerSlug: users.slug,
      sellerName: users.companyName,
      sellerContactName: users.name,
      sellerPhone: users.phoneE164,
      sellerCity: users.city,
      sellerState: users.state,
      sellerDescription: users.description,
      sellerPhotoUrl: users.photoUrl,
      sellerVerified: users.isVerified,
      sellerCreatedAt: users.createdAt,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(eq(listings.slug, slug))
    .limit(1);

  const listing = rows[0];
  if (!listing) return null;
  // rascunhos não são públicos; pausado/expirado/vendido continuam acessíveis
  if (listing.status === "draft") return null;

  const [images, specs, sellerActiveCountRows] = await Promise.all([
    db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listing.id))
      .orderBy(listingImages.sortOrder),
    db
      .select({
        specKey: listingSpecs.specKey,
        value: listingSpecs.value,
        unit: listingSpecs.unit,
      })
      .from(listingSpecs)
      .where(eq(listingSpecs.listingId, listing.id)),
    db
      .select({ c: sql<number>`count(*)` })
      .from(listings)
      .where(and(eq(listings.userId, listing.sellerId), eq(listings.status, "active"))),
  ]);

  return {
    ...listing,
    images,
    specs,
    sellerActiveCount: Number(sellerActiveCountRows[0]?.c ?? 0),
  };
}

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListingBySlug>>>;

/** Anúncios similares: mesma categoria, ativos, excluindo o próprio.
 *  Prioriza mesmo estado, depois mais recentes. */
export async function getSimilarListings(params: {
  listingId: string;
  categoryId: string | null;
  state: string | null;
  limit?: number;
}) {
  const { listingId, categoryId, state, limit = 4 } = params;
  const conditions = [eq(listings.status, "active"), ne(listings.id, listingId)];
  if (categoryId) conditions.push(eq(listings.categoryId, categoryId));

  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      city: listings.city,
      state: listings.state,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      status: listings.status,
      createdAt: listings.createdAt,
      sellerName: users.companyName,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(and(...conditions))
    .orderBy(
      state ? sql`(${listings.state} = ${state}) desc` : sql`1`,
      desc(listings.createdAt)
    )
    .limit(limit);

  const ids = rows.map((r) => r.id);
  const images = ids.length
    ? await db
        .select()
        .from(listingImages)
        .where(inArray(listingImages.listingId, ids))
        .orderBy(listingImages.sortOrder)
    : [];
  const cover = new Map<string, { url: string; alt: string | null }>();
  for (const img of images) {
    if (!cover.has(img.listingId)) cover.set(img.listingId, { url: img.url, alt: img.altText });
  }

  return rows.map((r) => ({
    ...r,
    coverUrl: cover.get(r.id)?.url ?? null,
    coverAlt: cover.get(r.id)?.alt ?? r.title,
  }));
}

/** Outros anúncios ativos do mesmo vendedor (para o bloco de vendido/prova de giro). */
export async function getSellerOtherListings(params: {
  sellerId: string;
  excludeListingId: string;
  limit?: number;
}) {
  const { sellerId, excludeListingId, limit = 4 } = params;
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      city: listings.city,
      state: listings.state,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      status: listings.status,
      createdAt: listings.createdAt,
      sellerName: users.companyName,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.userId, sellerId),
        eq(listings.status, "active"),
        ne(listings.id, excludeListingId)
      )
    )
    .orderBy(desc(listings.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.id);
  const images = ids.length
    ? await db
        .select()
        .from(listingImages)
        .where(inArray(listingImages.listingId, ids))
        .orderBy(listingImages.sortOrder)
    : [];
  const cover = new Map<string, { url: string; alt: string | null }>();
  for (const img of images) {
    if (!cover.has(img.listingId)) cover.set(img.listingId, { url: img.url, alt: img.altText });
  }

  return rows.map((r) => ({
    ...r,
    coverUrl: cover.get(r.id)?.url ?? null,
    coverAlt: cover.get(r.id)?.alt ?? r.title,
  }));
}

/** Incrementa view_count sem bloquear a renderização (fire-and-forget no caller). */
export async function incrementViewCount(listingId: string) {
  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, listingId));
}
