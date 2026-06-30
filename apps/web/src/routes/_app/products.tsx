import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { ilike } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
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
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={1}>{m.products_title()}</Heading>
        <Text type="supporting" color="secondary">
          {m.products_subtitle()}
        </Text>
      </VStack>
      {isLoading ? (
        <Text type="supporting" color="secondary">
          {m.common_loading()}
        </Text>
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
            <Button
              size="sm"
              variant="primary"
              label={m.products_new()}
              icon={<Icon icon={Plus} size="sm" />}
              onClick={() => setCreateOpen(true)}
            />
          }
        />
      )}
      {createOpen && (
        <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </VStack>
  );
}
