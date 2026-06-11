import { auditLogs, users } from "@admin-kit/shared";
import { and, count, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";
import { db } from "../db/client";

export type AuditAction = "create" | "update" | "delete";

export interface AuditQuery {
  actor?: string;
  resource?: string;
  action?: AuditAction;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page: number;
  pageSize: number;
}

function buildWhere(q: AuditQuery): SQL | undefined {
  const conds: SQL[] = [];
  if (q.actor) conds.push(ilike(users.email, `%${q.actor}%`));
  if (q.resource) conds.push(eq(auditLogs.resource, q.resource));
  if (q.action) conds.push(eq(auditLogs.action, q.action));
  // Dates are interpreted as UTC day bounds — fine for an internal tool.
  if (q.from)
    conds.push(gte(auditLogs.createdAt, new Date(`${q.from}T00:00:00.000Z`)));
  if (q.to)
    conds.push(lte(auditLogs.createdAt, new Date(`${q.to}T23:59:59.999Z`)));
  return conds.length > 0 ? and(...conds) : undefined;
}

export async function listAuditLogs(q: AuditQuery) {
  const where = buildWhere(q);
  const rows = await db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      actorEmail: users.email,
      action: auditLogs.action,
      resource: auditLogs.resource,
      resourceId: auditLogs.resourceId,
      before: auditLogs.before,
      after: auditLogs.after,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);

  const [totalRow] = await db
    .select({ value: count() })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(where);

  return {
    rows,
    total: totalRow?.value ?? 0,
    page: q.page,
    pageSize: q.pageSize,
  };
}

export async function listAuditResources(): Promise<string[]> {
  const rows = await db
    .select({ resource: auditLogs.resource })
    .from(auditLogs)
    .groupBy(auditLogs.resource)
    .orderBy(auditLogs.resource);
  return rows.map((r) => r.resource);
}
