import { Type } from "@sinclair/typebox";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { products } from "../db/products";

export const ProductSchema = createSelectSchema(products);

// Type.Omit(createInsertSchema(...)) hits TS2589 (excessively deep instantiation)
// with drizzle-typebox schemas — destructure-rest omits the same keys while new
// table columns still flow into the insert schema automatically.
const baseInsertSchema = createInsertSchema(products, {
  name: Type.String({ minLength: 1 }),
  priceCents: Type.Integer({ minimum: 0 }),
});
const {
  id: _id,
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  ...insertProps
} = baseInsertSchema.properties;
export const ProductInsertSchema = Type.Object(insertProps);

export const ProductUpdateSchema = Type.Partial(ProductInsertSchema);

export type Product = typeof products.$inferSelect;
export type ProductInsert = typeof ProductInsertSchema.static;
export type ProductUpdate = typeof ProductUpdateSchema.static;
