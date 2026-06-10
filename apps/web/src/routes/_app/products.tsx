import { ilike } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { productsCollection } from "@/features/products/collection";
import { productColumns } from "@/features/products/columns";
import { ProductFormDialog } from "@/features/products/form";

export const Route = createFileRoute("/_app/products")({
  component: ProductsScreen,
});

function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: products, isLoading } = useLiveQuery(
    (q) => {
      const base = q.from({ p: productsCollection });
      return base
        .where(({ p }) => ilike(p.name, `%${search}%`))
        .orderBy(({ p }) => p.createdAt, "desc");
    },
    [search],
  );

  const handleSearchChange = useCallback(
    (value: string) => setSearch(value),
    [],
  );

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-semibold text-2xl">Products</h1>
        <p className="text-muted-foreground text-sm">
          Example CRUD resource — optimistic mutations, live queries, audit
          trail.
        </p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <DataTable
          columns={productColumns}
          data={products}
          getRowId={(product) => product.id}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search products…"
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              New product
            </Button>
          }
        />
      )}
      <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
