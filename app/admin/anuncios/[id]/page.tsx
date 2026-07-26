import { db } from "@/lib/db/client";
import { listings, listingSpecs, listingImages, categories, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { AdminListingEditor } from "@/components/admin/AdminListingEditor";

export const dynamic = "force-dynamic";

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/painel/entrar");

  const { id } = await params;

  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) notFound();

  const [specs, images, allCategories, seller] = await Promise.all([
    db.select().from(listingSpecs).where(eq(listingSpecs.listingId, id)),
    db.select().from(listingImages).where(eq(listingImages.listingId, id)).orderBy(listingImages.sortOrder),
    db.select().from(categories).orderBy(categories.name),
    db.select({ name: users.name, companyName: users.companyName, email: users.email }).from(users).where(eq(users.id, listing.userId)).limit(1),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href="/admin/anuncios" className="text-sm text-ink-muted hover:underline mb-4 inline-block">
        ← Voltar para anúncios
      </a>
      <h1 className="font-heading text-2xl font-bold text-ink mb-1">{listing.title}</h1>
      <p className="text-sm text-ink-muted mb-2">
        Vendedor: {seller[0]?.companyName || seller[0]?.name || "—"} ({seller[0]?.email || "—"})
      </p>
      <p className="text-xs text-ink-muted mb-6">Slug: {listing.slug}</p>

      <AdminListingEditor
        listing={listing}
        specs={specs}
        images={images}
        categories={allCategories}
        adminId={admin.id}
      />
    </div>
  );
}
