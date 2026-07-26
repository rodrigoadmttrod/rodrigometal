import { db } from "@/lib/db/client";
import { users, sellerCategories, categories, listings } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { AdminUserEditor } from "@/components/admin/AdminUserEditor";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/painel/entrar");

  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) notFound();

  const [userCats, listingCounts] = await Promise.all([
    db
      .select({ categoryId: sellerCategories.categoryId, categoryName: categories.name })
      .from(sellerCategories)
      .leftJoin(categories, eq(sellerCategories.categoryId, categories.id))
      .where(eq(sellerCategories.userId, id)),
    db
      .select({ status: listings.status, count: count() })
      .from(listings)
      .where(eq(listings.userId, id))
      .groupBy(listings.status),
  ]);

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  const countsMap = new Map(listingCounts.map((r) => [r.status, r.count]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href="/admin/usuarios" className="text-sm text-ink-muted hover:underline mb-4 inline-block">
        ← Voltar para usuários
      </a>
      <h1 className="font-heading text-2xl font-bold text-ink mb-1">
        {user.companyName || user.name || "Sem nome"}
      </h1>
      <p className="text-sm text-ink-muted mb-6">{user.email}</p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-bold text-ink text-lg">{countsMap.get("active") ?? 0}</p>
          <p className="text-xs text-ink-muted">Ativos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-bold text-ink text-lg">{countsMap.get("draft") ?? 0}</p>
          <p className="text-xs text-ink-muted">Rascunhos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-bold text-ink text-lg">{countsMap.get("sold") ?? 0}</p>
          <p className="text-xs text-ink-muted">Vendidos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-bold text-ink text-lg">{countsMap.get("paused") ?? 0}</p>
          <p className="text-xs text-ink-muted">Pausados</p>
        </div>
      </div>

      <AdminUserEditor
        user={user}
        allCategories={allCategories}
        userCategoryIds={userCats.map((uc) => uc.categoryId)}
        adminId={admin.id}
      />
    </div>
  );
}
