import { and, count, desc, eq, gte, lte, like, or, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  categories,
  listingImages,
  listings,
  users,
} from "@/lib/db/schema";

const PAGE_SIZE = 20;

export type CategoryListingsParams = {
  categorySlug: string;
  state?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
};

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
  sellerName: users.companyName,
  sellerSlug: users.slug,
  sellerVerified: users.isVerified,
};

/** Categoria por slug. */
export async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Lista de cidades com anúncios ativos numa categoria (para nav geográfica). */
export async function getCitiesByCategory(categoryId: string) {
  const rows = await db
    .selectDistinct({ city: listings.city, state: listings.state, total: count() })
    .from(listings)
    .where(and(eq(listings.categoryId, categoryId), eq(listings.status, "active")))
    .groupBy(listings.city, listings.state)
    .orderBy(desc(sql`count(*)`));
  return rows.filter((r) => r.city);
}

/** Todos os slugs de categoria (para generateStaticParams / sitemap). */
export async function getAllCategorySlugs() {
  const rows = await db.select({ slug: categories.slug }).from(categories);
  return rows.map((r) => r.slug);
}

/** Anúncios de uma categoria com filtros opcionais (estado, cidade, preço) e paginação de 20. */
export async function getCategoryListings(params: CategoryListingsParams) {
  const { categorySlug, state, city, minPrice, maxPrice, page = 1 } = params;
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { category: null, listings: [], total: 0, totalPages: 0, page };

  const conditions = [
    eq(listings.categoryId, cat.id),
    eq(listings.status, "active"),
  ];
  if (state) conditions.push(eq(listings.state, state));
  if (city) conditions.push(eq(listings.city, city));
  if (minPrice != null) conditions.push(gte(listings.price, sql`${minPrice}`));
  if (maxPrice != null) conditions.push(lte(listings.price, sql`${maxPrice}`));

  const [totalRows, rows] = await Promise.all([
    db.select({ total: count() }).from(listings).where(and(...conditions)),
    db
      .select({ ...listingCardSelect })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const items = await withCovers(rows);
  return {
    category: cat,
    listings: items,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    page,
  };
}

/** Busca por palavra-chave em título e descrição, com mesmos filtros e paginação. */
export async function searchListings(params: {
  q: string;
  state?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  categorySlug?: string;
  page?: number;
}) {
  const { q, state, city, minPrice, maxPrice, categorySlug, page = 1 } = params;
  const conditions = [eq(listings.status, "active")];
  const term = `%${q.toLowerCase()}%`;
  conditions.push(
    or(
      like(sql`LOWER(${listings.title})`, term),
      like(sql`LOWER(${listings.description})`, term)
    )!
  );
  if (state) conditions.push(eq(listings.state, state));
  if (city) conditions.push(eq(listings.city, city));
  if (minPrice != null) conditions.push(gte(listings.price, sql`${minPrice}`));
  if (maxPrice != null) conditions.push(lte(listings.price, sql`${maxPrice}`));

  let categoryId: string | undefined;
  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (cat) {
      categoryId = cat.id;
      conditions.push(eq(listings.categoryId, cat.id));
    }
  }

  const [totalRows, rows] = await Promise.all([
    db.select({ total: count() }).from(listings).where(and(...conditions)),
    db
      .select({ ...listingCardSelect, categoryName: categories.name, categorySlug: categories.slug })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const items = await withCovers(rows);
  return {
    listings: items,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    page,
    categoryId,
  };
}
