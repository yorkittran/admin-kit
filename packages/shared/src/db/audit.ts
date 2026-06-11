import { sql } from "drizzle-orm";
import {
  customType,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// drizzle's jsonb type stringifies in toDriver and bun-sql serializes the
// parameter again, storing a JSON string instead of an object. Identity
// toDriver leaves serialization to the driver alone.
const jsonbColumn = customType<{ data: unknown }>({
  dataType() {
    return "jsonb";
  },
});

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
    before: jsonbColumn("before"),
    after: jsonbColumn("after"),
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
