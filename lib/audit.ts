import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { randomUUID } from "node:crypto";

export async function logAudit(params: {
  adminId: string;
  action: string;
  targetType: "user" | "listing" | "category" | "category_spec";
  targetId: string;
  targetName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
}) {
  await db.insert(auditLogs).values({
    id: randomUUID(),
    adminId: params.adminId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName || null,
    changes: params.changes ? JSON.stringify(params.changes) : null,
  });
}
