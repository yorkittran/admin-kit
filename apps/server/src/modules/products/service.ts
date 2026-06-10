import {
  type Product,
  type ProductInsert,
  type ProductUpdate,
  products,
} from "@admin-kit/shared";
import { desc, eq } from "drizzle-orm";
import { audit } from "../../audit/audit";
import { db } from "../../db/client";

export async function listProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function createProduct(
  actorId: string,
  data: ProductInsert,
): Promise<Product> {
  const [created] = await db.insert(products).values(data).returning();
  if (!created) throw new Error("insert returned no rows");
  await audit(actorId, "create", "products", created.id, null, created);
  return created;
}

export async function updateProduct(
  actorId: string,
  id: string,
  data: ProductUpdate,
): Promise<Product | null> {
  // Select-then-update is not transactional: a concurrent write between the
  // two statements can leave a stale `before` snapshot in the audit row (the
  // row itself stays correct). Acceptable for a low-write admin tool — wrap
  // in db.transaction() if that ever changes.
  const [before] = await db.select().from(products).where(eq(products.id, id));
  if (!before) return null;
  // drizzle throws on an empty .set() — a no-op PATCH is just the current row
  if (Object.keys(data).length === 0) return before;
  const [updated] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning();
  if (!updated) return null;
  await audit(actorId, "update", "products", id, before, updated);
  return updated;
}

export async function deleteProduct(
  actorId: string,
  id: string,
): Promise<Product | null> {
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();
  if (!deleted) return null;
  await audit(actorId, "delete", "products", id, deleted, null);
  return deleted;
}
