import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { getCategories, getListingForEdit, updateListingStatus } from "@/lib/queries/listing-form";
import { ListingForm } from "@/components/ListingForm";
import { EditActions } from "@/components/EditActions";
import { formatPrice, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarAnuncioPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/painel/entrar");

  const { id } = await params;
  const [data, categories] = await Promise.all([
    getListingForEdit(id, user.id),
    getCategories(),
  ]);

  if (!data) redirect("/painel");

  const { listing, images, specs } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Editar anúncio</h1>
          <p className="text-sm text-ink-muted mt-1">
            {listing.title} · {timeAgo(listing.createdAt)}
          </p>
        </div>
        <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          listing.status === "active" ? "bg-green-100 text-green-700" :
          listing.status === "sold" ? "bg-blue-100 text-blue-700" :
          listing.status === "paused" ? "bg-yellow-100 text-yellow-700" :
          listing.status === "archived" ? "bg-gray-100 text-gray-500" :
          "bg-gray-100 text-gray-600"
        }`}>
          {listing.status === "active" ? "Ativo" :
           listing.status === "sold" ? "Vendido" :
           listing.status === "paused" ? "Pausado" :
           listing.status === "archived" ? "Arquivado" :
           "Rascunho"}
        </span>
      </div>

      <ListingForm
        categories={categories}
        userCity={user.city || undefined}
        userState={user.state || undefined}
        initialData={{
          id: listing.id,
          title: listing.title,
          description: listing.description || "",
          categoryId: listing.categoryId || "",
          price: listing.price || "",
          priceOnRequest: listing.priceOnRequest,
          itemCondition: listing.itemCondition || "used_good",
          city: listing.city || "",
          state: listing.state || "",
          slug: listing.slug,
          status: listing.status,
          images: images.map((img) => ({ url: img.url, altText: img.altText || undefined })),
          specs: specs.map((s) => ({ specKey: s.specKey, value: s.value, unit: s.unit || "" })),
        }}
      />

      {/* Status actions */}
      <div className="mt-8 bg-card rounded-2xl shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Ações</h3>
        <EditActions listingId={listing.id} status={listing.status} />
      </div>
    </div>
  );
}
