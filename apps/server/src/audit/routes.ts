import { Elysia, t } from "elysia";
import { betterAuthPlugin } from "../auth/plugin";
import { listAuditLogs, listAuditResources } from "./service";

// pattern anchors the shape to YYYY-MM-DD (Elysia's "date" format alone also
// accepts datetimes and slash dates); format rejects impossible months (13+),
// but rollover days (e.g. 2026-02-30) pass and roll over in Date construction.
const dateString = t.String({
  format: "date",
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
});

export const auditModule = new Elysia({ prefix: "/audit" })
  .use(betterAuthPlugin)
  .get(
    "/",
    ({ query }) =>
      listAuditLogs({
        actor: query.actor,
        resource: query.resource,
        action: query.action,
        from: query.from,
        to: query.to,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 25,
      }),
    {
      role: "admin",
      query: t.Object({
        actor: t.Optional(t.String()),
        resource: t.Optional(t.String()),
        action: t.Optional(
          t.Union([
            t.Literal("create"),
            t.Literal("update"),
            t.Literal("delete"),
          ]),
        ),
        from: t.Optional(dateString),
        to: t.Optional(dateString),
        page: t.Optional(
          t.Numeric({ minimum: 1, maximum: 1_000_000, multipleOf: 1 }),
        ),
        pageSize: t.Optional(
          t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 }),
        ),
      }),
    },
  )
  .get("/resources", () => listAuditResources(), { role: "admin" });
