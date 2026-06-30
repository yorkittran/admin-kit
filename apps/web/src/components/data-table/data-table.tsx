import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import {
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { m } from "@/paraglide/messages";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  initialSearch?: string;
  toolbar?: ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  onSearchChange,
  searchPlaceholder,
  initialSearch,
  toolbar,
}: DataTableProps<TData>) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 300,
    key: "datatable-search",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [colMenuOpen, setColMenuOpen] = useState(false);

  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  });
  useEffect(() => {
    onSearchChangeRef.current(debouncedSearch);
  }, [debouncedSearch]);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  const { rows } = table.getRowModel();
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 49,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const firstRow = virtualRows[0];
  const lastRow = virtualRows[virtualRows.length - 1];
  const paddingTop = firstRow ? firstRow.start : 0;
  const paddingBottom = lastRow ? virtualizer.getTotalSize() - lastRow.end : 0;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const selectedCount = Object.keys(rowSelection).length;

  const columnMenuItems = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
    .map((column) => ({
      label: column.id,
      icon: column.getIsVisible() ? <Icon icon="check" size="sm" /> : undefined,
      onClick: () => {
        column.toggleVisibility(!column.getIsVisible());
        setColMenuOpen(true);
      },
    }));

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <TextInput
          data-slot="datatable-search"
          label={searchPlaceholder}
          isLabelHidden
          value={search}
          onChange={(value) => setSearch(value)}
          placeholder={searchPlaceholder}
          startIcon="search"
          width="20rem"
        />
        <div className="ml-auto">
          <DropdownMenu
            isMenuOpen={colMenuOpen}
            onOpenChange={setColMenuOpen}
            button={{
              label: m.datatable_columns(),
              variant: "secondary",
              size: "sm",
              icon: <Icon icon="viewColumns" size="sm" />,
            }}
            items={columnMenuItems}
          />
        </div>
        {toolbar}
      </div>
      <div
        ref={containerRef}
        className="h-[32rem] overflow-auto rounded-md border"
      >
        <Table density="compact" hasHover>
          <thead className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} isHeaderRow>
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHeaderCell>
                ))}
              </TableRow>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  style={{ height: paddingTop, padding: 0 }}
                />
              </TableRow>
            )}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center"
                >
                  <Text color="secondary">{m.datatable_no_results()}</Text>
                </TableCell>
              </TableRow>
            ) : (
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
            {paddingBottom > 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  style={{ height: paddingBottom, padding: 0 }}
                />
              </TableRow>
            )}
          </tbody>
        </Table>
      </div>
      <Text type="supporting" color="secondary">
        {m.datatable_selected({ selected: selectedCount, total: rows.length })}
      </Text>
    </div>
  );
}
