import { db } from "@/lib/db/client";
import { listings, listingSpecs, listingImages, categories, categorySpecs, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/format";

export type SpecInput = { specKey: string; value: string; unit?: string };
export type ImageInput = { url: string; sortOrder: number; altText?: string };

async function getSellerSlug(userId: string): Promise<string | null> {
  const [row] = await db.select({ slug: users.slug }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.slug ?? null;
}

export async function getCategories() {
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.name);
}

export async function getCategoriesWithSpecs() {
  const cats = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.name);
  const specs = await db.select().from(categorySpecs).orderBy(categorySpecs.sortOrder);
  const specMap = new Map<string, typeof specs>();
  for (const spec of specs) {
    const arr = specMap.get(spec.categoryId) ?? [];
    arr.push(spec);
    specMap.set(spec.categoryId, arr);
  }
  return cats.map((cat) => ({
    ...cat,
    specs: specMap.get(cat.id) ?? [],
  }));
}

export async function getListingForEdit(listingId: string, userId: string) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)))
    .limit(1);

  if (!listing) return null;

  const [images, specs] = await Promise.all([
    db.select().from(listingImages).where(eq(listingImages.listingId, listingId)).orderBy(listingImages.sortOrder),
    db.select().from(listingSpecs).where(eq(listingSpecs.listingId, listingId)),
  ]);

  return { listing, images, specs };
}

export async function createListing(
  userId: string,
  data: {
    title: string;
    description?: string;
    categoryId?: string;
    price?: number | null;
    priceOnRequest: boolean;
    itemCondition: string;
    city: string;
    state: string;
    slug?: string;
    status: "draft" | "active";
  },
  images: ImageInput[],
  specs: SpecInput[]
) {
  const id = randomUUID();
  const baseSlug = slugify(data.slug || data.title);
  // Garante unicidade do slug com 6 chars do UUID
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(listings).values({
    id,
    userId,
    categoryId: data.categoryId || null,
    slug,
    title: data.title,
    description: data.description || null,
    city: data.city || null,
    state: data.state || null,
    price: data.price ? data.price.toString() : null,
    priceOnRequest: data.priceOnRequest,
    itemCondition: data.itemCondition as any,
    status: data.status,
    source: "web",
  });

  if (images.length > 0) {
    await db.insert(listingImages).values(
      images.map((img, i) => ({
        id: randomUUID(),
        listingId: id,
        url: img.url,
        sortOrder: img.sortOrder ?? i,
        altText: img.altText || null,
      }))
    );
  }

  if (specs.length > 0) {
    await db.insert(listingSpecs).values(
      specs
        .filter((s) => s.specKey.trim() && s.value.trim())
        .map((s) => ({
          id: randomUUID(),
          listingId: id,
          specKey: s.specKey.trim(),
          value: s.value.trim(),
          unit: s.unit?.trim() || null,
        }))
    );
  }

  // Revalida rotas afetadas
  revalidatePath("/");
  if (data.categoryId) {
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, data.categoryId)).limit(1);
    if (cat) {
      revalidatePath(`/categoria/${cat.slug}`);
      if (data.city) revalidatePath(`/categoria/${cat.slug}/${data.city}`);
    }
  }
  const sellerSlug = await getSellerSlug(userId);
  if (sellerSlug) revalidatePath(`/vendedor/${sellerSlug}`);
  revalidatePath(`/painel`);

  return { id, slug };
}

export async function updateListing(
  listingId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    categoryId?: string;
    price?: number | null;
    priceOnRequest: boolean;
    itemCondition: string;
    city: string;
    state: string;
    slug?: string;
  },
  images: ImageInput[],
  specs: SpecInput[]
) {
  const existing = await getListingForEdit(listingId, userId);
  if (!existing) throw new Error("Listing not found or not owned by user");

  const isDraft = existing.listing.status === "draft";
  // Slug só pode ser editado se for rascunho
  const newSlug = isDraft && data.slug
    ? `${slugify(data.slug)}-${listingId.slice(0, 6)}`
    : existing.listing.slug;

  await db
    .update(listings)
    .set({
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || null,
      price: data.price ? data.price.toString() : null,
      priceOnRequest: data.priceOnRequest,
      itemCondition: data.itemCondition as any,
      city: data.city || null,
      state: data.state || null,
      slug: newSlug,
    })
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)));

  // Replaces all images
  await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
  if (images.length > 0) {
    await db.insert(listingImages).values(
      images.map((img, i) => ({
        id: randomUUID(),
        listingId,
        url: img.url,
        sortOrder: img.sortOrder ?? i,
        altText: img.altText || null,
      }))
    );
  }

  // Replaces all specs
  await db.delete(listingSpecs).where(eq(listingSpecs.listingId, listingId));
  if (specs.length > 0) {
    await db.insert(listingSpecs).values(
      specs
        .filter((s) => s.specKey.trim() && s.value.trim())
        .map((s) => ({
          id: randomUUID(),
          listingId,
          specKey: s.specKey.trim(),
          value: s.value.trim(),
          unit: s.unit?.trim() || null,
        }))
    );
  }

  // Revalida rotas afetadas
  revalidatePath("/");
  revalidatePath(`/anuncio/${newSlug}`);
  revalidatePath(`/painel`);
  const sellerSlug = await getSellerSlug(userId);
  if (sellerSlug) revalidatePath(`/vendedor/${sellerSlug}`);
  if (data.categoryId) {
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, data.categoryId)).limit(1);
    if (cat) {
      revalidatePath(`/categoria/${cat.slug}`);
      if (data.city) revalidatePath(`/categoria/${cat.slug}/${data.city}`);
    }
  }
  if (existing.listing.slug !== newSlug) {
    revalidatePath(`/anuncio/${existing.listing.slug}`);
  }

  return { id: listingId, slug: newSlug };
}

export async function updateListingStatus(
  listingId: string,
  userId: string,
  status: "draft" | "active" | "paused" | "sold" | "archived"
) {
  // Busca o slug antes do update para revalidar a rota correta
  const [existing] = await db
    .select({ slug: listings.slug })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)))
    .limit(1);

  if (!existing) return null;

  await db
    .update(listings)
    .set({
      status,
      soldAt: status === "sold" ? new Date() : null,
    })
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)));

  revalidatePath("/");
  revalidatePath(`/anuncio/${existing.slug}`);
  revalidatePath(`/painel`);
  const sellerSlug = await getSellerSlug(userId);
  if (sellerSlug) revalidatePath(`/vendedor/${sellerSlug}`);
  revalidatePath(`/sitemap.xml`);
  // Revalida categoria e cidade se aplicável
  const [fullListing] = await db
    .select({ categoryId: listings.categoryId, city: listings.city })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (fullListing?.categoryId) {
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, fullListing.categoryId)).limit(1);
    if (cat) {
      revalidatePath(`/categoria/${cat.slug}`);
      if (fullListing.city) revalidatePath(`/categoria/${cat.slug}/${fullListing.city}`);
    }
  }

  return { id: listingId, slug: existing.slug };
}
