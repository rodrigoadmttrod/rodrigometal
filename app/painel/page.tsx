import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardListings, getDashboardStats } from "@/lib/queries/painel";
import { formatPrice, timeAgo, CONDITION_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-700" },
  draft: { label: "Rascunho", className: "bg-gray-100 text-gray-600" },
  paused: { label: "Pausado", className: "bg-yellow-100 text-yellow-700" },
  sold: { label: "Vendido", className: "bg-blue-100 text-blue-700" },
  expired: { label: "Expirado", className: "bg-gray-100 text-gray-500" },
  archived: { label: "Arquivado", className: "bg-gray-100 text-gray-500" },
};

export default async function PainelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/painel/entrar");

  const [listings, stats] = await Promise.all([
    getDashboardListings(user.id),
    getDashboardStats(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Olá, {user.companyName || user.name}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {user.city && user.state ? `${user.city} – ${user.state}` : "Bem-vindo ao painel"}
          </p>
        </div>
        <Link
          href="/painel/anunciar"
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] text-center"
        >
          + Anunciar grátis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Ativos" value={stats.active} color="text-green-600" />
        <StatCard label="Pausados" value={stats.paused} color="text-yellow-600" />
        <StatCard label="Vendidos" value={stats.sold} color="text-blue-600" />
        <StatCard label="Rascunhos" value={stats.draft} color="text-gray-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-card rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-extrabold text-ink">{stats.totalViews}</p>
          <p className="text-xs text-ink-muted mt-1">Visualizações totais</p>
        </div>
        <div className="bg-card rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-extrabold text-ink">{stats.totalContacts}</p>
          <p className="text-xs text-ink-muted mt-1">Contatos recebidos</p>
        </div>
      </div>

      {/* Listings table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-ink">Meus anúncios</h2>
        </div>

        {listings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-ink-muted text-sm mb-4">
              Você ainda não tem anúncios. Que tal começar agora?
            </p>
            <Link
              href="/painel/anunciar"
              className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              + Criar primeiro anúncio
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {listings.map((listing) => {
              const status = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.draft;
              return (
                <Link
                  key={listing.id}
                  href={`/painel/anuncio/${listing.id}/editar`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                    {listing.coverUrl ? (
                      <img
                        src={listing.coverUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                        Sem foto
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {formatPrice(listing.price, listing.priceOnRequest)}
                      {listing.city && ` · ${listing.city}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-ink-muted">
                    <div className="text-center">
                      <p className="font-bold text-ink">{listing.viewCount}</p>
                      <p>views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-ink">{listing.contactCount}</p>
                      <p>contatos</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6">
        <Link
          href="/painel/perfil"
          className="text-accent font-semibold text-sm hover:underline"
        >
          Editar perfil →
        </Link>
        <form action="/api/auth/signout" method="POST">
          <input type="hidden" name="callbackUrl" value="/painel/entrar" />
          <button type="submit" className="text-ink-muted text-sm hover:underline">
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-4 text-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-1">{label}</p>
    </div>
  );
}
