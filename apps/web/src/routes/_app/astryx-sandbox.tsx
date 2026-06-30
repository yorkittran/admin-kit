/**
 * Astryx verification spike (Task 1 — GATE). Throwaway probe route, deleted in
 * Task 11. Proves @astryxdesign/core renders under Vite 7 + React 19 and that a
 * TanStack `useVirtualizer` drives rows inside Astryx <Table> markup.
 *
 * Every component's API was pulled from `bun --cwd=apps/web run astryx -- component <Name>`
 * before use — not guessed. Astryx ships pre-compiled StyleX CSS (dist/astryx.css),
 * so no StyleX/Babel build plugin is required by this app.
 */

import { Theme } from "@astryxdesign/core";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Field } from "@astryxdesign/core/Field";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Table, TableCell, TableRow } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_app/astryx-sandbox")({
  component: AstryxSandbox,
});

type SpikeRow = {
  id: number;
  name: string;
  role: string;
};

// 3 static rows, per the brief. Virtualization is proven structurally:
// the same useVirtualizer padding-row technique used by the real DataTable
// drives which TableRows mount, here inside Astryx's <Table> markup.
const ROWS: SpikeRow[] = [
  { id: 1, name: "Ada Lovelace", role: "Admin" },
  { id: 2, name: "Alan Turing", role: "Editor" },
  { id: 3, name: "Grace Hopper", role: "Viewer" },
];

function VirtualizedAstryxTable() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: ROWS.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const firstRow = virtualRows[0];
  const lastRow = virtualRows[virtualRows.length - 1];
  const paddingTop = firstRow ? firstRow.start : 0;
  const paddingBottom = lastRow ? virtualizer.getTotalSize() - lastRow.end : 0;

  return (
    <div ref={scrollRef} style={{ maxHeight: "12rem", overflow: "auto" }}>
      <Table density="compact" hasHover>
        <thead>
          <TableRow isHeaderRow>
            <TableCell>Name</TableCell>
            <TableCell>Role</TableCell>
          </TableRow>
        </thead>
        <tbody>
          {paddingTop > 0 ? (
            <tr style={{ height: paddingTop }}>
              <td colSpan={2} />
            </tr>
          ) : null}
          {virtualRows.map((virtualRow) => {
            const row = ROWS[virtualRow.index];
            if (!row) return null;
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
              </TableRow>
            );
          })}
          {paddingBottom > 0 ? (
            <tr style={{ height: paddingBottom }}>
              <td colSpan={2} />
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}

function AstryxSandbox() {
  const [name, setName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Theme theme={neutralTheme} mode="system">
      <Stack gap={6}>
        <Heading level={1}>Astryx verification spike</Heading>
        <Text>
          Probe route proving @astryxdesign/core renders under Vite 7 + React
          19.
        </Text>

        <Card>
          <Stack gap={4}>
            <Heading level={3}>Buttons</Heading>
            <Stack gap={2} direction="horizontal">
              <Button label="Primary" variant="primary" />
              <Button label="Secondary" variant="secondary" />
              <Button label="Ghost" variant="ghost" />
            </Stack>
          </Stack>
        </Card>

        <Card>
          <Stack gap={4}>
            <Heading level={3}>Text input inside a Field</Heading>
            <Field label="Display name" inputID="spike-name">
              <TextInput
                label="Display name"
                isLabelHidden
                value={name}
                onChange={(value) => setName(value)}
                placeholder="Type a name"
              />
            </Field>
          </Stack>
        </Card>

        <Card>
          <Stack gap={4}>
            <Heading level={3}>Dialog</Heading>
            <Button
              label="Open dialog"
              variant="secondary"
              onClick={() => setIsDialogOpen(true)}
            />
            <Dialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              purpose="info"
            >
              <DialogHeader
                title="Astryx dialog"
                subtitle="Rendered from the spike route"
                onOpenChange={setIsDialogOpen}
              />
              <Text>
                The dialog overlay mounts and the backdrop blocks the page.
              </Text>
            </Dialog>
          </Stack>
        </Card>

        <Card>
          <Stack gap={4}>
            <Heading level={3}>Virtualized Astryx Table</Heading>
            <Text>
              3 static rows driven by TanStack useVirtualizer inside Astryx
              table markup.
            </Text>
            <VirtualizedAstryxTable />
          </Stack>
        </Card>
      </Stack>
    </Theme>
  );
}
