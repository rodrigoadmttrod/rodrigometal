import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { getCategoriesWithSpecs } from "@/lib/queries/listing-form";
import { ListingForm } from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function AnunciarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/painel/entrar");

  const categories = await getCategoriesWithSpecs();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink mb-6">Novo anúncio</h1>
      <ListingForm
        categories={categories}
        userCity={user.city || undefined}
        userState={user.state || undefined}
      />
    </div>
  );
}
