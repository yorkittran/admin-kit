import { Elysia, t } from "elysia";
import { betterAuthPlugin } from "../auth/plugin";
import { listAuditLogs, listAuditResources } from "./service";

// format: "date" (RFC 3339 full-date) over a bare \d{4}-\d{2}-\d{2} regex:
// the regex would accept calendar-invalid input like 2026-13-99, which turns
// into an Invalid Date and throws inside drizzle (500 instead of 422).
const dateString = t.String({ format: "date" });

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
        page: t.Optional(t.Numeric({ minimum: 1 })),
        pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
    },
  )
  .get("/resources", () => listAuditResources(), { role: "admin" });
