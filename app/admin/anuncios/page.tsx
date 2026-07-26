import { db } from "@/lib/db/client";
import { listings, categories, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAnunciosPage() {
  const allListings = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      status: listings.status,
      price: listings.price,
      priceOnRequest: listings.priceOnRequest,
      city: listings.city,
      state: listings.state,
      createdAt: listings.createdAt,
      categoryName: categories.name,
      userName: users.name,
      userCompany: users.companyName,
    })
    .from(listings)
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .orderBy(desc(listings.createdAt))
    .limit(100);

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    draft: "bg-gray-100 text-gray-500",
    paused: "bg-yellow-50 text-yellow-700",
    sold: "bg-blue-50 text-blue-700",
    archived: "bg-gray-100 text-gray-400",
  };

  const statusLabels: Record<string, string> = {
    active: "Ativo",
    draft: "Rascunho",
    paused: "Pausado",
    sold: "Vendido",
    archived: "Arquivado",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Anúncios</h1>
        <p className="text-sm text-ink-muted mt-1">{allListings.length} anúncios (mostrando os 100 mais recentes)</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {allListings.map((l) => (
            <Link
              key={l.id}
              href={`/admin/anuncios/${l.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-surface transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink truncate">{l.title}</p>
                  <span className={`text-xs rounded px-2 py-0.5 font-semibold ${statusColors[l.status] || ""}`}>
                    {statusLabels[l.status] || l.status}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {l.categoryName || "Sem categoria"} · {l.userCompany || l.userName || "Sem vendedor"} · {l.city}/{l.state}
                </p>
              </div>
              <span className="text-ink-muted text-sm shrink-0">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
