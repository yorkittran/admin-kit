import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
]);

// No FK to users — audit rows must outlive any future actor cleanup.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    actorId: text("actor_id").notNull(),
    action: auditAction("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_resource_idx").on(table.resource, table.resourceId),
    index("audit_logs_actor_idx").on(table.actorId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
