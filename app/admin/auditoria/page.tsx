import { db } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "user.update": "Editar usuário",
  "user.deactivate": "Desativar usuário",
  "listing.update": "Editar anúncio",
  "listing.archive": "Arquivar anúncio",
  "listing.sold": "Marcar vendido",
  "category.update": "Editar categoria",
  "category_spec.update": "Editar spec",
};

const TARGET_LABELS: Record<string, string> = {
  user: "Usuário",
  listing: "Anúncio",
  category: "Categoria",
  category_spec: "Spec",
};

export default async function AdminAuditPage() {
  const logs = await db
    .select({
      id: auditLogs.id,
      adminId: auditLogs.adminId,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      targetName: auditLogs.targetName,
      changes: auditLogs.changes,
      createdAt: auditLogs.createdAt,
      adminName: users.name,
      adminCompany: users.companyName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.adminId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Auditoria</h1>
        <p className="text-sm text-ink-muted mt-1">{logs.length} registros (mostrando os 200 mais recentes)</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-ink-muted">Nenhuma alteração registrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((log) => {
              let changesObj: Record<string, { from: unknown; to: unknown }> | null = null;
              try {
                changesObj = log.changes ? JSON.parse(log.changes) : null;
              } catch {
                changesObj = null;
              }

              return (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-xs rounded bg-surface px-2 py-0.5 text-ink-muted">
                          {TARGET_LABELS[log.targetType] || log.targetType}
                        </span>
                      </div>
                      {log.targetName && (
                        <p className="text-xs text-ink-muted mt-0.5">{log.targetName}</p>
                      )}
                      {changesObj && Object.keys(changesObj).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(changesObj).slice(0, 5).map(([key, val]) => (
                            <div key={key} className="text-xs text-ink-muted">
                              <span className="font-semibold">{key}:</span>{" "}
                              <span className="line-through opacity-60">
                                {String(val.from).slice(0, 50) || "—"}
                              </span>{" "}
                              →{" "}
                              <span className="text-accent font-medium">
                                {String(val.to).slice(0, 50) || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-ink-muted">
                        {log.adminCompany || log.adminName || "Admin"}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
