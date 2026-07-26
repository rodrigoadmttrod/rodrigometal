import { db } from "@/lib/db/client";
import { users, sellerCategories, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSellerCategories(userId: string) {
  return db
    .select({
      categoryId: sellerCategories.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(sellerCategories)
    .innerJoin(categories, eq(sellerCategories.categoryId, categories.id))
    .where(eq(sellerCategories.userId, userId));
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    companyName?: string;
    description?: string;
    city?: string;
    state?: string;
    phoneE164?: string;
    email?: string;
    photoUrl?: string | null;
  }
) {
  await db
    .update(users)
    .set({
      name: data.name || null,
      companyName: data.companyName || null,
      description: data.description || null,
      city: data.city || null,
      state: data.state || null,
      phoneE164: data.phoneE164 || undefined,
      email: data.email || undefined,
      photoUrl: data.photoUrl !== undefined ? data.photoUrl : undefined,
    })
    .where(eq(users.id, userId));

  // Revalida a vitrine do vendedor
  const [user] = await db.select({ slug: users.slug }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.slug) {
    revalidatePath(`/vendedor/${user.slug}`);
  }
  revalidatePath(`/painel`);

  return { ok: true };
}

export async function updateSellerCategories(userId: string, categoryIds: string[]) {
  // Remove all existing
  await db.delete(sellerCategories).where(eq(sellerCategories.userId, userId));
  // Insert new ones
  if (categoryIds.length > 0) {
    await db.insert(sellerCategories).values(
      categoryIds.map((categoryId) => ({
        id: randomUUID(),
        userId,
        categoryId,
      }))
    );
  }

  // Revalida a vitrine
  const [user] = await db.select({ slug: users.slug }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.slug) {
    revalidatePath(`/vendedor/${user.slug}`);
  }

  return { ok: true };
}

import { randomUUID } from "node:crypto";
