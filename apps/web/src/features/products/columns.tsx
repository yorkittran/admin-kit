import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/data-table/sortable-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label={m.datatable_select_all()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={m.datatable_select_row()}
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
      <span className="block max-w-64 truncate text-muted-foreground">
        {row.original.description ?? "—"}
      </span>
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
        variant={row.original.status === "active" ? "default" : "secondary"}
      >
        {row.original.status === "active"
          ? m.products_status_active()
          : m.products_status_archived()}
      </Badge>
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
