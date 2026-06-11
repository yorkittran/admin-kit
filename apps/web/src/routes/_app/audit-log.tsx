import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const { data, isPending } = useQuery({
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">{m.audit_title()}</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="audit-actor">{m.audit_actor()}</Label>
          <Input
            id="audit-actor"
            className="w-56"
            placeholder={m.audit_filter_actor_placeholder()}
            value={filters.actor}
            onChange={(e) => setFilter("actor", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{m.audit_resource()}</Label>
          <Select
            value={filters.resource}
            onValueChange={(v) => setFilter("resource", v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{m.audit_all_resources()}</SelectItem>
              {resources.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>{m.audit_action()}</Label>
          <Select
            value={filters.action}
            onValueChange={(v) => setFilter("action", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{m.audit_all_actions()}</SelectItem>
              {(Object.keys(actionLabels) as AuditAction[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {actionLabels[a]()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="audit-from">{m.audit_from()}</Label>
          <Input
            id="audit-from"
            type="date"
            className="w-40"
            value={filters.from}
            onChange={(e) => setFilter("from", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="audit-to">{m.audit_to()}</Label>
          <Input
            id="audit-to"
            type="date"
            className="w-40"
            value={filters.to}
            onChange={(e) => setFilter("to", e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.audit_time()}</TableHead>
            <TableHead>{m.audit_actor()}</TableHead>
            <TableHead>{m.audit_action()}</TableHead>
            <TableHead>{m.audit_resource()}</TableHead>
            <TableHead>{m.audit_record()}</TableHead>
            <TableHead className="text-right">{m.common_actions()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                {m.common_loading()}
              </TableCell>
            </TableRow>
          )}
          {!isPending && (data?.rows.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                {m.audit_no_rows()}
              </TableCell>
            </TableRow>
          )}
          {data?.rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(row.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{row.actorEmail ?? row.actorId}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.action === "delete" ? "destructive" : "secondary"
                  }
                >
                  {actionLabels[row.action as AuditAction]()}
                </Badge>
              </TableCell>
              <TableCell>{row.resource}</TableCell>
              <TableCell className="font-mono text-xs">
                {row.resourceId.slice(0, 8)}…
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDetail({ before: row.before, after: row.after })
                  }
                >
                  {m.audit_view()}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {m.audit_page_info({
            page: String(page),
            pages: String(pages),
            total: String(total),
          })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {m.audit_prev()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            {m.audit_next()}
          </Button>
        </div>
      </div>

      <Dialog
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{m.audit_diff_title()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 font-medium text-sm">{m.audit_before()}</p>
              <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                {detail?.before ? JSON.stringify(detail.before, null, 2) : "—"}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium text-sm">{m.audit_after()}</p>
              <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                {detail?.after ? JSON.stringify(detail.after, null, 2) : "—"}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
