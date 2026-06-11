import { auditLogs, sessions } from "@admin-kit/shared";
import { lt } from "drizzle-orm";
import { db } from "../db/client";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

// Sweep logic lives in plain exported functions (cron.ts wraps them) so they
// can be invoked directly for verification or one-off manual runs.

export async function sweepExpiredSessions(): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id });
  if (deleted.length > 0) {
    logger.info({ count: deleted.length }, "swept expired sessions");
  }
  return deleted.length;
}

// AUDIT_RETENTION_DAYS <= 0 (the default) means keep everything.
export async function pruneAuditLogs(): Promise<number> {
  if (env.AUDIT_RETENTION_DAYS <= 0) return 0;
  const cutoff = new Date(Date.now() - env.AUDIT_RETENTION_DAYS * 86_400_000);
  const deleted = await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, cutoff))
    .returning({ id: auditLogs.id });
  if (deleted.length > 0) {
    logger.info({ count: deleted.length }, "pruned audit logs");
  }
  return deleted.length;
}
