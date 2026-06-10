import type { Product, ProductInsert, ProductUpdate } from "@admin-kit/shared";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

// Drizzle types say Date, but Dates arrive as ISO strings over JSON.
export type ProductRow = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// Carries server status + message (and the failing field for 422s) out of
// the persistence handlers so forms can surface them after rollback.
export class ProductMutationError extends Error {
  status: number;
  property?: string;
  constructor(status: number, message: string, property?: string) {
    super(message);
    this.name = "ProductMutationError";
    this.status = status;
    this.property = property;
  }
}

function toMutationError(error: {
  status: number;
  value: unknown;
}): ProductMutationError {
  const value = error.value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const message =
      typeof record.summary === "string"
        ? record.summary
        : typeof record.message === "string"
          ? record.message
          : `Request failed (${error.status})`;
    // Elysia validation errors carry the failing path, e.g. "/name"
    const property =
      typeof record.property === "string"
        ? record.property.replace(/^\//, "")
        : undefined;
    return new ProductMutationError(error.status, message, property);
  }
  return new ProductMutationError(
    error.status,
    typeof value === "string" ? value : `Request failed (${error.status})`,
  );
}

export const productsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await api.products.get();
      if (error) throw toMutationError(error);
      // Eden's inferred type keeps drizzle's Date fields, but the wire
      // format is ISO strings — ProductRow is the honest runtime type.
      return data as unknown as ProductRow[];
    },
    queryClient,
    getKey: (product) => product.id,
    onInsert: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const {
          id: _id,
          createdAt: _c,
          updatedAt: _u,
          ...body
        } = mutation.modified;
        const { error } = await api.products.post(body as ProductInsert);
        if (error) throw toMutationError(error);
      }
    },
    onUpdate: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const { error } = await api
          .products({ id: String(mutation.key) })
          .patch(mutation.changes as ProductUpdate);
        if (error) throw toMutationError(error);
      }
    },
    onDelete: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const { error } = await api
          .products({ id: String(mutation.key) })
          .delete();
        if (error) throw toMutationError(error);
      }
    },
  }),
);
