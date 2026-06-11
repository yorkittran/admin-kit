import { cron, Patterns } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { logger } from "../lib/logger";
import { pruneAuditLogs, sweepExpiredSessions } from "./sweeps";

// croner doesn't await or catch async callbacks — without the .catch a DB
// hiccup mid-sweep would surface as an unhandled rejection instead of a log.
const guard = (name: string, sweep: () => Promise<number>) => () =>
  void sweep().catch((err: unknown) => {
    logger.error({ err }, `cron job ${name} failed`);
  });

export const cronJobs = new Elysia({ name: "cron-jobs" })
  .use(
    cron({
      name: "sweep-expired-sessions",
      pattern: Patterns.everyDayAt("03:00"),
      run: guard("sweep-expired-sessions", sweepExpiredSessions),
    }),
  )
  .use(
    cron({
      name: "prune-audit-logs",
      pattern: Patterns.everyDayAt("03:30"),
      run: guard("prune-audit-logs", pruneAuditLogs),
    }),
  );
