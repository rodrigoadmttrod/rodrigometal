import { db } from "@/lib/db/client";
import { users, listings } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      companyName: users.companyName,
      email: users.email,
      city: users.city,
      state: users.state,
      role: users.role,
      slug: users.slug,
      isVerified: users.isVerified,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  // Get listing counts per user
  const listingCounts = await db
    .select({ userId: listings.userId, count: count() })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.userId);
  const countMap = new Map(listingCounts.map((r) => [r.userId, r.count]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Usuários</h1>
        <p className="text-sm text-ink-muted mt-1">{allUsers.length} usuários cadastrados</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {allUsers.map((u) => (
            <Link
              key={u.id}
              href={`/admin/usuarios/${u.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink">
                    {u.companyName || u.name || "Sem nome"}
                  </p>
                  {u.role === "admin" && (
                    <span className="text-xs rounded bg-accent/10 text-accent px-2 py-0.5 font-semibold">ADM</span>
                  )}
                  {u.isVerified && (
                    <span className="text-xs rounded bg-green-50 text-green-700 px-2 py-0.5 font-semibold">Verificado</span>
                  )}
                  {!u.isActive && (
                    <span className="text-xs rounded bg-red-50 text-red-600 px-2 py-0.5 font-semibold">Desativado</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{u.email}</p>
                {u.city && u.state && (
                  <p className="text-xs text-ink-muted mt-0.5">{u.city}/{u.state}</p>
                )}
              </div>

              <div className="hidden sm:block text-center">
                <p className="font-bold text-ink text-sm">{countMap.get(u.id) ?? 0}</p>
                <p className="text-xs text-ink-muted">anúncios</p>
              </div>

              <span className="text-ink-muted text-sm shrink-0">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
