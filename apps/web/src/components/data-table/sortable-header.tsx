import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>;
  children: ReactNode;
}

export function SortableHeader<TData>({
  column,
  children,
}: SortableHeaderProps<TData>) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <Icon className="ml-1 size-4" />
    </Button>
  );
}
