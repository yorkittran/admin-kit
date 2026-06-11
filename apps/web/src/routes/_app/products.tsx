import { ilike } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { productsCollection } from "@/features/products/collection";
import { productColumns } from "@/features/products/columns";
import { ProductFormDialog } from "@/features/products/form";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/products")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; new?: boolean } => ({
    q: typeof search.q === "string" && search.q !== "" ? search.q : undefined,
    new: search.new === true || search.new === "true" ? true : undefined,
  }),
  component: ProductsScreen,
});

function ProductsScreen() {
  const { q, new: openNew } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (openNew) {
      setCreateOpen(true);
      navigate({
        search: (prev) => ({ ...prev, new: undefined }),
        replace: true,
      });
    }
  }, [openNew, navigate]);

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
        <h1 className="font-semibold text-2xl">{m.products_title()}</h1>
        <p className="text-muted-foreground text-sm">{m.products_subtitle()}</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">{m.common_loading()}</p>
      ) : (
        <DataTable
          // Remount when ?q changes so initialSearch re-applies on palette
          // jumps that land while this route is already mounted.
          key={q ?? ""}
          columns={productColumns}
          data={products}
          getRowId={(product) => product.id}
          initialSearch={q}
          onSearchChange={handleSearchChange}
          searchPlaceholder={m.products_search_placeholder()}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              {m.products_new()}
            </Button>
          }
        />
      )}
      {createOpen && (
        <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
