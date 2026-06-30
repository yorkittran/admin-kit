import { Badge } from "@astryxdesign/core/Badge";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Text } from "@astryxdesign/core/Text";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/data-table/sortable-header";
import { m } from "@/paraglide/messages";
import type { ProductRow } from "./collection";
import { ProductRowActions } from "./row-actions";

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const productColumns: ColumnDef<ProductRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <CheckboxInput
        label={m.datatable_select_all()}
        isLabelHidden
        value={
          table.getIsAllRowsSelected()
            ? true
            : table.getIsSomeRowsSelected()
              ? "indeterminate"
              : false
        }
        onChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <CheckboxInput
        label={m.datatable_select_row()}
        isLabelHidden
        value={row.getIsSelected()}
        onChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>{m.products_name_label()}</SortableHeader>
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "description",
    header: () => m.products_description_label(),
    cell: ({ row }) => (
      <Text type="supporting" color="secondary">
        {row.original.description ?? "—"}
      </Text>
    ),
  },
  {
    accessorKey: "priceCents",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {m.products_price_header()}
      </SortableHeader>
    ),
    cell: ({ row }) => formatPrice(row.original.priceCents),
  },
  {
    accessorKey: "status",
    header: () => m.products_status_label(),
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "success" : "neutral"}
        label={
          row.original.status === "active"
            ? m.products_status_active()
            : m.products_status_archived()
        }
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {m.products_created_header()}
      </SortableHeader>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => <ProductRowActions product={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
