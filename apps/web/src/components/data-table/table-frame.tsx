import { TableContext, type TableContextValue } from "@astryxdesign/core/Table";
import type { ReactNode, Ref } from "react";

// Astryx's <Table> always wraps its <table> in its own horizontal-scroll
// container (overflow-x:auto + container-bleed negative margins), even in
// children mode. That wrapper fights any outer scroll container we add: the
// sticky <thead> pins to the inner wrapper (which never scrolls vertically)
// instead of ours, and the bleed margin pulls the table past our border.
//
// Rendering a plain <table> and supplying TableContext ourselves (the same
// provider <Table> uses) keeps the compact density + hover cell styling while
// leaving this bordered div as the single scroll container the sticky header
// pins to. Shared by DataTable and the audit-log table so both frame
// identically.
const TABLE_CONTEXT: TableContextValue = {
  density: "compact",
  dividers: "rows",
  isStriped: false,
  hasHover: true,
  verticalAlign: "middle",
  textOverflow: "wrap",
};

interface TableFrameProps {
  /** `<thead>` + `<tbody>` for the table. */
  children: ReactNode;
  /** Forwarded to the scroll container (e.g. TanStack Virtual's scroll ref). */
  scrollRef?: Ref<HTMLDivElement>;
  /** Extra classes for the scroll container — typically a height constraint. */
  className?: string;
}

export function TableFrame({
  children,
  scrollRef,
  className,
}: TableFrameProps) {
  return (
    <div
      ref={scrollRef}
      className={`overflow-auto rounded-md border border-border ${className ?? ""}`}
    >
      <TableContext value={TABLE_CONTEXT}>
        <table className="w-full table-auto border-collapse">{children}</table>
      </TableContext>
    </div>
  );
}
