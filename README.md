# admin-kit

Boilerplate for internal management systems. Bun · Elysia · Eden · Vite · React 19 · TanStack · Drizzle · Postgres 18 · shadcn/ui.

## Quick start

```bash
cp apps/server/.env.example apps/server/.env && cp apps/web/.env.example apps/web/.env
docker compose up -d        # postgres 18 + mailpit (http://localhost:8025)
bun install
bun run db:migrate
bun run db:seed             # admin@admin-kit.local / admin123456
bun dev                     # server :3000 (+ /openapi docs), web :5173
```

Sign in at http://localhost:5173 with `admin@admin-kit.local` / `admin123456`.

## Auth

Better Auth (cookie sessions in Postgres, admin plugin) mounted at `/api/auth/*`.
Roles: `admin`, `member`. Public sign-up is disabled — admins invite users from
the Users screen; invitees get an email (Mailpit locally) with a set-password
link. Guard custom Elysia routes with the macros from `apps/server/src/auth/plugin.ts`:
`{ auth: true }` (401 without session) or `{ role: "admin" }` (403 without role).
Emails render with React Email and deliver through a pg-boss queue.

## CRUD pattern

`products` is the example resource — clone its shape to add your own:

1. **Table** — `packages/shared/src/db/products.ts` (Drizzle, uuidv7 PK)
2. **Schemas** — `packages/shared/src/schemas/products.ts` (drizzle-typebox →
   insert/update schemas; one schema validates the Elysia route AND the
   TanStack Form via `toStandardSchema`)
3. **Server module** — `apps/server/src/modules/products/` (`service.ts` calls
   `audit()` on every mutation; `routes.ts` is thin + TypeBox-validated)
4. **Collection** — `apps/web/src/features/products/collection.ts` (TanStack DB
   on TanStack Query: optimistic insert/update/delete with automatic rollback)
5. **Screen** — `useLiveQuery` + shared `DataTable` (virtualized rows, sorting,
   column visibility, debounced search) + form dialog built from
   `components/form/` field wrappers

Every mutation writes an `audit_logs` row (actor, action, before/after jsonb).

## Hardening & operations

- Security headers (`elysia-helmet`, CSP off for the Scalar docs page) and a global rate limit (300 req/min/IP, `RateLimit-*` headers) wrap every route; `/health` is exempt from the limit.
- Errors leave the API as `{ code, message }` envelopes — except 422 validation, which keeps Elysia's native shape so forms can map field errors (the rate limiter's 429 is plain text).
- Traces export over OTLP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set; otherwise instrumentation is a no-op.
- Cron sweeps (`@elysiajs/cron`): expired sessions daily at 03:00, audit retention at 03:30 (`AUDIT_RETENTION_DAYS=0` keeps everything).

## Audit log viewer

Admins get `/audit-log`: filter by actor email, resource, action, and date range; paginated server-side; every row opens a before/after JSON diff. The API lives at `GET /audit` (admin-only).

## i18n

Paraglide compiles `messages/{en,vi}.json` into typed functions (`m.key()`). The Vite plugin recompiles on save; `src/paraglide/` is generated — never edit it. Locale persists per browser (localStorage) and switches from Profile → Language. Adding a string = add the key to BOTH catalogs, then use `m.your_key()`. Adding a locale = extend `locales` in `project.inlang/settings.json` + add `messages/<code>.json`.

## Command palette

⌘K (Ctrl+K) anywhere inside the app: navigate screens, search products by name (jumps with the list pre-filtered), create a product, switch theme, sign out. `/` focuses the active table's search box.

## Devtools

Dev builds mount the TanStack Devtools shell (Query, Router, Pacer panels — a DB panel doesn't exist yet). `@tanstack/devtools-vite` strips all of it from production bundles.

## Docs

- Spec: docs/superpowers/specs/
- Plans: docs/superpowers/plans/
- Decisions (ADRs): docs/decisions/ (added in plan 05)
