import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { categories, listings, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getAllCategorySlugs, getCategoryBySlug, getCitiesByCategory } from "@/lib/queries/category";
import { getAllSellerSlugs } from "@/lib/queries/seller";

const BASE = "https://rodrigometal.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Páginas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/buscar`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  // Categorias
  const catSlugs = await getAllCategorySlugs();
  const categoryRoutes: MetadataRoute.Sitemap = catSlugs.map((slug) => ({
    url: `${BASE}/categoria/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Categoria + cidade (rotas geográficas)
  const cityRoutes: MetadataRoute.Sitemap = [];
  for (const slug of catSlugs) {
    const cat = await getCategoryBySlug(slug);
    if (!cat) continue;
    const cities = await getCitiesByCategory(cat.id);
    for (const c of cities) {
      if (c.city) {
        cityRoutes.push({
          url: `${BASE}/categoria/${slug}/${encodeURIComponent(c.city)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // Anúncios (active + sold — vendidos continuam indexados)
  const listingRows = await db
    .select({ slug: listings.slug, updatedAt: listings.updatedAt, status: listings.status })
    .from(listings)
    .where(inArray(listings.status, ["active", "sold"]));
  const listingRoutes: MetadataRoute.Sitemap = listingRows.map((l) => ({
    url: `${BASE}/anuncio/${l.slug}`,
    lastModified: l.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: l.status === "active" ? 0.9 : 0.5,
  }));

  // Vendedores
  const sellerSlugs = await getAllSellerSlugs();
  const sellerRoutes: MetadataRoute.Sitemap = sellerSlugs.map((slug) => ({
    url: `${BASE}/vendedor/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...listingRoutes, ...sellerRoutes];
}
