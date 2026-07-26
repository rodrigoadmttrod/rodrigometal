import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCategories } from "@/lib/queries/listing-form";
import { getSellerCategories } from "@/lib/queries/profile";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/painel/entrar");

  const [categories, sellerCats] = await Promise.all([
    getCategories(),
    getSellerCategories(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink mb-6">Meu perfil</h1>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="mb-6 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 transition-colors hover:bg-accent/10"
        >
          <div>
            <p className="font-heading text-sm font-bold text-accent">Painel ADM</p>
            <p className="text-xs text-ink-muted mt-0.5">Gerenciar categorias, usuários e anúncios</p>
          </div>
          <span className="text-accent text-lg">→</span>
        </Link>
      )}
      <ProfileForm
        user={{
          name: user.name,
          companyName: user.companyName,
          description: user.description,
          city: user.city,
          state: user.state,
          photoUrl: user.photoUrl,
          slug: user.slug,
        }}
        categories={categories}
        sellerCategories={sellerCats}
      />
    </div>
  );
}
