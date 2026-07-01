import { timestamp } from "drizzle-orm/pg-core";

// created/updated columns shared verbatim by every table. A factory (not a
// shared object) so each table gets its own builder instances.
export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
