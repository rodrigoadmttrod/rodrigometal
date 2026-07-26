import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { listings, listingSpecs, categories, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT — update listing (admin override)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, categoryId, price, priceOnRequest, itemCondition, city, state, status, specs, adminId } = body;

  // Get current listing for audit
  const [current] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!current) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Build changes for audit
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (title !== undefined && title !== current.title) changes.title = { from: current.title, to: title };
  if (description !== undefined && description !== current.description) changes.description = { from: current.description, to: description };
  if (categoryId !== undefined && categoryId !== current.categoryId) changes.categoryId = { from: current.categoryId, to: categoryId };
  if (price !== undefined && price !== current.price) changes.price = { from: current.price, to: price };
  if (priceOnRequest !== undefined && priceOnRequest !== current.priceOnRequest) changes.priceOnRequest = { from: current.priceOnRequest, to: priceOnRequest };
  if (itemCondition !== undefined && itemCondition !== current.itemCondition) changes.itemCondition = { from: current.itemCondition, to: itemCondition };
  if (city !== undefined && city !== current.city) changes.city = { from: current.city, to: city };
  if (state !== undefined && state !== current.state) changes.state = { from: current.state, to: state };
  if (status !== undefined && status !== current.status) changes.status = { from: current.status, to: status };

  // Update listing
  await db
    .update(listings)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(price !== undefined && { price: price ? price.toString() : null }),
      ...(priceOnRequest !== undefined && { priceOnRequest }),
      ...(itemCondition !== undefined && { itemCondition }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(status !== undefined && { status, soldAt: status === "sold" ? new Date() : null }),
    })
    .where(eq(listings.id, id));

  // Update specs if provided
  if (Array.isArray(specs)) {
    await db.delete(listingSpecs).where(eq(listingSpecs.listingId, id));
    const validSpecs = specs.filter((s: any) => s.specKey?.trim() && s.value?.trim());
    if (validSpecs.length > 0) {
      await db.insert(listingSpecs).values(
        validSpecs.map((s: any) => ({
          id: randomUUID(),
          listingId: id,
          specKey: s.specKey.trim(),
          value: s.value.trim(),
          unit: s.unit?.trim() || null,
        }))
      );
    }
    changes.specs = { from: "previous specs", to: validSpecs.length + " specs" };
  }

  // Log audit
  await logAudit({
    adminId: adminId || admin.id,
    action: status === "archived" ? "listing.archive" : status === "sold" ? "listing.sold" : "listing.update",
    targetType: "listing",
    targetId: id,
    targetName: title || current.title,
    changes,
  });

  // Revalidate paths
  revalidatePath("/");
  revalidatePath(`/anuncio/${current.slug}`);
  revalidatePath("/admin/anuncios");
  revalidatePath("/painel");
  if (current.categoryId) {
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, current.categoryId)).limit(1);
    if (cat) revalidatePath(`/categoria/${cat.slug}`);
  }

  return NextResponse.json({ ok: true });
}
