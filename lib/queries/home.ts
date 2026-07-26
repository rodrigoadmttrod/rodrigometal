import { db } from "@/lib/db/client";
import {
  categories,
  listingImages,
  listings,
  users,
} from "@/lib/db/schema";
import { count, desc, eq, sql, inArray } from "drizzle-orm";
import { and } from "drizzle-orm";

export async function getHomeData() {
  // Categories with active listing count
  const cats = await db.select().from(categories);
  const activeCounts = await db
    .select({
      categoryId: listings.categoryId,
      activeCount: count(),
    })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.categoryId);

  const countMap = new Map(activeCounts.map((c) => [c.categoryId, c.activeCount]));

  // Ordenar categorias conforme ordem definida na home
  const CATEGORY_ORDER = [
    "sucata-metalica",
    "maquinas",
    "redutores",
    "motores-eletricos",
    "bombas",
    "ventiladores",
    "caldeiras",
    "rolamentos",
    "equipamentos-industriais",
  ];
  const orderMap = new Map(CATEGORY_ORDER.map((slug, i) => [slug, i]));
  const categoriesWithCounts = cats
    .map((c) => ({
      ...c,
      activeCount: Number(countMap.get(c.id) ?? 0),
    }))
    .filter((c) => c.activeCount > 0)
    .sort((a, b) => (orderMap.get(a.slug) ?? 99) - (orderMap.get(b.slug) ?? 99));

  // Recent active listings (first 8) with cover image and seller name
  const recent = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt))
    .limit(8);

  const recentWithDetails = await Promise.all(
    recent.map(async (l) => {
      const [img] = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, l.id))
        .orderBy(listingImages.sortOrder)
        .limit(1);

      const [seller] = await db
        .select({ name: users.companyName, slug: users.slug })
        .from(users)
        .where(eq(users.id, l.userId))
        .limit(1);

      return {
        ...l,
        coverUrl: img?.url ?? null,
        coverAlt: img?.altText ?? l.title,
        sellerName: seller?.name ?? "Vendedor",
      };
    })
  );

  // Featured sellers (up to 3 with most active listings)
  const sellerCounts = await db
    .select({
      id: users.id,
      slug: users.slug,
      companyName: users.companyName,
      city: users.city,
      state: users.state,
      description: users.description,
      photoUrl: users.photoUrl,
      isVerified: users.isVerified,
      activeCount: count(),
    })
    .from(users)
    .innerJoin(listings, eq(listings.userId, users.id))
    .where(eq(listings.status, "active"))
    .groupBy(users.id)
    .orderBy(desc(count()))
    .limit(3);

  // Para cada vendedor em destaque: buscar uma foto de anúncio (determinística)
  // e as categorias em que atua. Sem rotação dinâmica — SEO-safe.
  const sellersWithExtras = await Promise.all(
    sellerCounts.map(async (s) => {
      // Primeira imagem do anúncio mais recente do vendedor
      const [firstListing] = await db
        .select({ id: listings.id, title: listings.title })
        .from(listings)
        .where(and(eq(listings.userId, s.id), eq(listings.status, "active")))
        .orderBy(desc(listings.createdAt))
        .limit(1);

      let listingPhotoUrl: string | null = null;
      let listingPhotoAlt: string = s.companyName ?? "Vendedor";
      if (firstListing) {
        const [img] = await db
          .select()
          .from(listingImages)
          .where(eq(listingImages.listingId, firstListing.id))
          .orderBy(listingImages.sortOrder)
          .limit(1);
        if (img) {
          listingPhotoUrl = img.url;
          listingPhotoAlt = img.altText ?? firstListing.title;
        }
      }

      // Categorias em que o vendedor atua
      const sellerCats = await db
        .selectDistinct({ name: categories.name, slug: categories.slug })
        .from(listings)
        .innerJoin(categories, eq(listings.categoryId, categories.id))
        .where(and(eq(listings.userId, s.id), eq(listings.status, "active")));

      return {
        ...s,
        companyName: (s.companyName ?? "Vendedor").replace(/\s*\(Exemplo\)\s*$/i, ""),
        listingPhotoUrl,
        listingPhotoAlt,
        sellerCategories: sellerCats.map((c) => c.name),
      };
    })
  );

  return {
    categories: categoriesWithCounts,
    recentListings: recentWithDetails,
    featuredSellers: sellersWithExtras,
  };
}
