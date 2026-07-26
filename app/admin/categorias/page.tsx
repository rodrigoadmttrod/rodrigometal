import Link from "next/link";
import { db } from "@/lib/db/client";
import { categories, categorySpecs, listings } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const cats = await db.select().from(categories).orderBy(categories.name);

  // Get listing counts per category
  const listingCounts = await db
    .select({ categoryId: listings.categoryId, count: count() })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.categoryId);
  const countMap = new Map(listingCounts.map((r) => [r.categoryId, r.count]));

  // Get spec counts per category
  const specCounts = await db
    .select({ categoryId: categorySpecs.categoryId, count: count() })
    .from(categorySpecs)
    .groupBy(categorySpecs.categoryId);
  const specMap = new Map(specCounts.map((r) => [r.categoryId, r.count]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Categorias</h1>
          <p className="text-sm text-ink-muted mt-1">{cats.length} categorias no catálogo</p>
        </div>
        <Link
          href="/admin/categorias/nova"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        >
          + Nova categoria
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {cats.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{cat.name}</p>
                  {!cat.isActive && (
                    <span className="text-xs rounded bg-gray-100 text-gray-500 px-2 py-0.5">Inativa</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5 font-mono">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-xs text-ink-muted mt-0.5 truncate">{cat.description}</p>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-6 text-xs text-ink-muted">
                <div className="text-center">
                  <p className="font-bold text-ink">{specMap.get(cat.id) ?? 0}</p>
                  <p>specs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-ink">{countMap.get(cat.id) ?? 0}</p>
                  <p>anúncios</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/categorias/${cat.id}/specs`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-colors"
                >
                  Specs
                </Link>
                <Link
                  href={`/admin/categorias/${cat.id}/editar`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
