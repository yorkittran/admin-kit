import { type auditAction, auditLogs } from "@admin-kit/shared";
import { db } from "../db/client";

// Derived from the pgEnum — the DB schema stays the single source of truth.
export type AuditAction = (typeof auditAction.enumValues)[number];

// Awaited (not fire-and-forget) so a mutation and its audit row land
// together — an unaudited mutation is worse than a slightly slower one.
export async function audit(
  actorId: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await db.insert(auditLogs).values({
    actorId,
    action,
    resource,
    resourceId,
    before: before ?? null,
    after: after ?? null,
  });
}
