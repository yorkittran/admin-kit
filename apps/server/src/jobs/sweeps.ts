import { auditLogs, sessions } from "@admin-kit/shared";
import { lt } from "drizzle-orm";
import { db } from "../db/client";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

// Sweep logic lives in plain exported functions (cron.ts wraps them) so they
// can be invoked directly for verification or one-off manual runs.

// Bare (non-returning) deletes resolve to Bun's raw SQLResultArray carrying the affected-row `count`, but drizzle types it `never` — see drizzle-orm/bun-sql/session.js.
type SweepResult = { count: number };

export async function sweepExpiredSessions(): Promise<number> {
  const result = (await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))) as SweepResult;
  if (result.count > 0) {
    logger.info({ count: result.count }, "swept expired sessions");
  }
  return result.count;
}

// AUDIT_RETENTION_DAYS <= 0 (the default) means keep everything.
export async function pruneAuditLogs(): Promise<number> {
  if (env.AUDIT_RETENTION_DAYS <= 0) return 0;
  const cutoff = new Date(Date.now() - env.AUDIT_RETENTION_DAYS * 86_400_000);
  const result = (await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, cutoff))) as SweepResult;
  if (result.count > 0) {
    logger.info({ count: result.count }, "pruned audit logs");
  }
  return result.count;
}
