import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import type { Column } from "@tanstack/react-table";
import type { ReactNode } from "react";

interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>;
  children: ReactNode;
}

export function SortableHeader<TData>({
  column,
  children,
}: SortableHeaderProps<TData>) {
  const sorted = column.getIsSorted();
  const icon =
    sorted === "asc"
      ? "arrowUp"
      : sorted === "desc"
        ? "arrowDown"
        : "arrowsUpDown";
  return (
    <Button
      label={typeof children === "string" ? children : column.id}
      variant="ghost"
      size="sm"
      onClick={column.getToggleSortingHandler()}
      endContent={<Icon icon={icon} size="sm" />}
    >
      {children}
    </Button>
  );
}
