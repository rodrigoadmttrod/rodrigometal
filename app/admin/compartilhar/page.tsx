import { db } from "@/lib/db/client";
import { listings, listingImages, listingSpecs, categories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { SharePanel } from "@/components/admin/SharePanel";

export const dynamic = "force-dynamic";

export default async function AdminSharePage() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/painel/entrar");

  const allListings = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      description: listings.description,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      status: listings.status,
      shareCount: listings.shareCount,
      createdAt: listings.createdAt,
      categoryId: listings.categoryId,
    })
    .from(listings)
    .orderBy(desc(listings.createdAt))
    .limit(100);

  // Get images and specs for all listings
  const listingIds = allListings.map((l) => l.id);
  const [allImages, allSpecs, allCategories] = await Promise.all([
    listingIds.length > 0
      ? db.select().from(listingImages).where(eq(listingImages.listingId, listingIds[0]))
      : Promise.resolve([]),
    listingIds.length > 0
      ? db.select().from(listingSpecs)
      : Promise.resolve([]),
    db.select().from(categories),
  ]);

  // For efficiency, get images for all listings in one query
  const imagesMap = new Map<string, string[]>();
  const specsMap = new Map<string, { specKey: string; value: string; unit: string | null }[]>();
  const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

  // Fetch all images
  for (const l of allListings) {
    const imgs = await db.select().from(listingImages).where(eq(listingImages.listingId, l.id)).orderBy(listingImages.sortOrder);
    imagesMap.set(l.id, imgs.map((i) => i.url));
    
    const specs = await db.select().from(listingSpecs).where(eq(listingSpecs.listingId, l.id));
    specsMap.set(l.id, specs.map((s) => ({ specKey: s.specKey, value: s.value, unit: s.unit })));
  }

  const listingsWithExtras = allListings.map((l) => ({
    ...l,
    categoryName: l.categoryId ? catMap.get(l.categoryId) || null : null,
    images: imagesMap.get(l.id) || [],
    specs: specsMap.get(l.id) || [],
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Compartilhar</h1>
        <p className="text-sm text-ink-muted mt-1">
          Clique em "Compartilhar" para ver a legenda pronta para Instagram. O contador registra quantas vezes você compartilhou — não bloqueia.
        </p>
      </div>

      <SharePanel listings={listingsWithExtras} />
    </div>
  );
}
