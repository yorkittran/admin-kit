import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import {
  HStack,
  Layout,
  LayoutContent,
  VStack,
} from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { TableCell, TableHeaderCell, TableRow } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { TableFrame } from "@/components/data-table/table-frame";
import { api } from "@/lib/api";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/audit-log")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AuditLogPage,
});

const ALL = "__all__";
const PAGE_SIZE = 25;

type AuditAction = "create" | "update" | "delete";

const actionLabels: Record<AuditAction, () => string> = {
  create: m.audit_action_create,
  update: m.audit_action_update,
  delete: m.audit_action_delete,
};

interface Filters {
  actor: string;
  resource: string;
  action: string;
  from: string;
  to: string;
}

function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>({
    actor: "",
    resource: ALL,
    action: ALL,
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<{
    before: unknown;
    after: unknown;
  } | null>(null);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  const { data: resources = [] } = useQuery({
    queryKey: ["audit-resources"],
    queryFn: async () => {
      const { data, error } = await api.audit.resources.get();
      if (error) throw error;
      return data;
    },
  });

  const { data, isPending, isError } = useQuery({
    queryKey: ["audit", filters, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.audit.get({
        query: {
          ...(filters.actor ? { actor: filters.actor } : {}),
          ...(filters.resource !== ALL ? { resource: filters.resource } : {}),
          ...(filters.action !== ALL
            ? { action: filters.action as AuditAction }
            : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
          page,
          pageSize: PAGE_SIZE,
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resourceOptions = [
    { value: ALL, label: m.audit_all_resources() },
    ...resources.map((r) => ({ value: r, label: r })),
  ];

  const actionOptions = [
    { value: ALL, label: m.audit_all_actions() },
    ...(Object.keys(actionLabels) as AuditAction[]).map((a) => ({
      value: a,
      label: actionLabels[a](),
    })),
  ];

  return (
    <VStack gap={4}>
      <Heading level={1}>{m.audit_title()}</Heading>

      <HStack gap={3} wrap="wrap" vAlign="end">
        <TextInput
          label={m.audit_actor()}
          placeholder={m.audit_filter_actor_placeholder()}
          value={filters.actor}
          onChange={(value) => setFilter("actor", value)}
        />
        <Selector
          label={m.audit_resource()}
          options={resourceOptions}
          value={filters.resource}
          onChange={(v) => setFilter("resource", v)}
        />
        <Selector
          label={m.audit_action()}
          options={actionOptions}
          value={filters.action}
          onChange={(v) => setFilter("action", v)}
        />
        <DateInput
          label={m.audit_from()}
          value={(filters.from || undefined) as ISODateString | undefined}
          onChange={(v) => setFilter("from", v ?? "")}
        />
        <DateInput
          label={m.audit_to()}
          value={(filters.to || undefined) as ISODateString | undefined}
          onChange={(v) => setFilter("to", v ?? "")}
        />
      </HStack>

      {isError && <Banner status="error" title={m.audit_load_error()} />}

      <TableFrame className="max-h-[40rem]">
        <thead className="sticky top-0 z-10 bg-surface">
          <TableRow isHeaderRow>
            <TableHeaderCell>{m.audit_time()}</TableHeaderCell>
            <TableHeaderCell>{m.audit_actor()}</TableHeaderCell>
            <TableHeaderCell>{m.audit_action()}</TableHeaderCell>
            <TableHeaderCell>{m.audit_resource()}</TableHeaderCell>
            <TableHeaderCell>{m.audit_record()}</TableHeaderCell>
            <TableHeaderCell>{m.common_actions()}</TableHeaderCell>
          </TableRow>
        </thead>
        <tbody>
          {isPending && (
            <TableRow>
              <TableCell colSpan={6}>
                <Text color="secondary">{m.common_loading()}</Text>
              </TableCell>
            </TableRow>
          )}
          {!isPending && !isError && (data?.rows.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Text color="secondary">{m.audit_no_rows()}</Text>
              </TableCell>
            </TableRow>
          )}
          {data?.rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Text type="body" textWrap="nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </Text>
              </TableCell>
              <TableCell>{row.actorEmail ?? row.actorId}</TableCell>
              <TableCell>
                <Badge
                  variant={row.action === "delete" ? "error" : "neutral"}
                  label={actionLabels[row.action]()}
                />
              </TableCell>
              <TableCell>{row.resource}</TableCell>
              <TableCell>
                <span className="font-mono text-xs" title={row.resourceId}>
                  …{row.resourceId.slice(-8)}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  label={m.audit_view()}
                  onClick={() =>
                    setDetail({ before: row.before, after: row.after })
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </TableFrame>

      <HStack justify="between" vAlign="center">
        <Text type="supporting" color="secondary">
          {m.audit_page_info({
            page: String(page),
            pages: String(pages),
            total: String(total),
          })}
        </Text>
        <HStack gap={2}>
          <Button
            variant="secondary"
            size="sm"
            label={m.audit_prev()}
            isDisabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          />
          <Button
            variant="secondary"
            size="sm"
            label={m.audit_next()}
            isDisabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          />
        </HStack>
      </HStack>

      <Dialog
        isOpen={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
        width={700}
      >
        <Layout
          height="auto"
          header={
            <DialogHeader
              title={m.audit_diff_title()}
              onOpenChange={(o) => !o && setDetail(null)}
            />
          }
          content={
            <LayoutContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <VStack gap={1}>
                  <Text type="label" weight="medium">
                    {m.audit_before()}
                  </Text>
                  <pre className="max-h-80 overflow-auto rounded-md bg-surface p-3 text-xs">
                    {detail?.before
                      ? JSON.stringify(detail.before, null, 2)
                      : "—"}
                  </pre>
                </VStack>
                <VStack gap={1}>
                  <Text type="label" weight="medium">
                    {m.audit_after()}
                  </Text>
                  <pre className="max-h-80 overflow-auto rounded-md bg-surface p-3 text-xs">
                    {detail?.after
                      ? JSON.stringify(detail.after, null, 2)
                      : "—"}
                  </pre>
                </VStack>
              </div>
            </LayoutContent>
          }
        />
      </Dialog>
    </VStack>
  );
}
