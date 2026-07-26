import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  categories,
  contactEvents,
  listingImages,
  listings,
  users,
} from "@/lib/db/schema";

/** Card de listagem com capa (mesmo shape usado por ListingGrid). */
async function withCovers<
  T extends { id: string; title: string }
>(rows: T[]) {
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

const listingCardSelect = {
  id: listings.id,
  slug: listings.slug,
  title: listings.title,
  city: listings.city,
  state: listings.state,
  price: listings.price,
  priceOnRequest: listings.priceOnRequest,
  status: listings.status,
  createdAt: listings.createdAt,
  soldAt: listings.soldAt,
};

/** Vitrine do vendedor: perfil + ativos + vendidos recentemente + contatos recebidos. */
export async function getSellerBySlug(slug: string) {
  const rows = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
  const seller = rows[0];
  if (!seller || seller.role === "buyer") return null;

  const [activeRows, soldRows, contactCountRows, categoryRows] = await Promise.all([
    db
      .select({ ...listingCardSelect, sellerName: users.companyName })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.userId, seller.id), eq(listings.status, "active")))
      .orderBy(desc(listings.createdAt)),
    // Vendidos recentemente = prova de giro (limite 8, mais recentes primeiro)
    db
      .select({ ...listingCardSelect, sellerName: users.companyName })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.userId, seller.id), eq(listings.status, "sold")))
      .orderBy(desc(listings.soldAt))
      .limit(8),
    db
      .select({ total: count() })
      .from(contactEvents)
      .where(eq(contactEvents.sellerId, seller.id)),
    // Categorias em que o vendedor tem anúncios (para o texto da vitrine)
    db
      .selectDistinct({ name: categories.name, slug: categories.slug })
      .from(listings)
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .where(eq(listings.userId, seller.id)),
  ]);

  const [active, sold] = await Promise.all([withCovers(activeRows), withCovers(soldRows)]);

  return {
    seller,
    active,
    sold,
    contactCount: contactCountRows[0]?.total ?? 0,
    categories: categoryRows,
  };
}

/** Slugs de vendedores para generateStaticParams / sitemap. */
export async function getAllSellerSlugs() {
  const rows = await db
    .selectDistinct({ slug: users.slug })
    .from(users)
    .innerJoin(listings, eq(listings.userId, users.id));
  return rows.map((r) => r.slug).filter((s): s is string => !!s);
}
