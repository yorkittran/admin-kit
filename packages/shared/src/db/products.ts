import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./columns";

export const productStatus = pgEnum("product_status", ["active", "archived"]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  status: productStatus("status").notNull().default("active"),
  ...timestamps(),
});
