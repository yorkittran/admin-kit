# admin-kit — Design

**Date:** 2026-06-10
**Status:** Approved design, pre-implementation
**Purpose:** Cloneable boilerplate for internal management systems (CRUD resources, internal users). Optimized for CRUD velocity, end-to-end type safety, and newest-tech showcase. Ships AI-ready (Claude Code configuration committed in repo).

## 1. Stack decisions (settled — see docs/decisions/ ADRs, do not re-litigate)

| Layer | Choice | ADR |
|---|---|---|
| Runtime | Bun | 001 |
| BE framework | ElysiaJS + Eden treaty | 002 |
| FE | Vite SPA + React 19 + TanStack Router | 003 |
| Validation | TypeBox everywhere (no zod) | 004 |
| Client data | TanStack DB on TanStack Query | 005 |
| DB | Postgres 18 + Drizzle (bun-sql driver), native `uuidv7()` PKs | — |
| Auth | Better Auth (admin plugin, RBAC: admin/member) | — |
| UI | shadcn/ui + Tailwind v4, dark mode (own ThemeProvider) | — |
| i18n | Paraglide, locales: en + vi | — |
| Email | Nodemailer + React Email, Mailpit local | — |
| Jobs | pg-boss (Postgres-backed) + @elysiajs/cron | — |
| Logging/Obs | pino (+ @bogeychan/elysia-logger) + @elysiajs/opentelemetry | — |
| Tooling | Biome, Bun workspaces | — |
| Deploy | Container PaaS (Railway/Render/Fly), Docker + compose | — |

Explicitly out of scope: tests, file upload, settings page, serverless deploy.

## 2. Monorepo layout

```
admin-kit/
├── apps/
│   ├── server/                 # Elysia API (@admin-kit/server)
│   │   ├── src/
│   │   │   ├── index.ts        # app entry, exports `type App` for Eden
│   │   │   ├── db/             # drizzle client, migrations
│   │   │   ├── auth/           # Better Auth config + guard macro (auth / role)
│   │   │   ├── modules/        # one folder per resource
│   │   │   │   └── products/   # routes.ts + service.ts (example resource)
│   │   │   ├── audit/          # audit helper + audit query routes
│   │   │   ├── jobs/           # pg-boss workers (email send), cron defs
│   │   │   ├── email/          # nodemailer transport + react-email templates
│   │   │   └── lib/            # env (t3-env + TypeBox), errors, openapi, otel, logger
│   │   ├── CLAUDE.md
│   │   └── Dockerfile
│   └── web/                    # Vite SPA (@admin-kit/web)
│       ├── src/
│       │   ├── routes/         # TanStack Router file-based
│       │   │   ├── _auth/      # login, forgot-password, reset-password
│       │   │   └── _app/       # guarded: dashboard, products, users, audit-log, profile
│       │   ├── components/     # ui/ (shadcn), data-table/, command-palette/
│       │   ├── features/       # per-resource: collection.ts, columns.tsx, form.tsx
│       │   ├── lib/            # eden client, query client, theme, hotkeys
│       │   └── paraglide/      # generated (do not edit)
│       ├── CLAUDE.md
│       └── Dockerfile          # build → nginx static
├── packages/
│   └── shared/                 # @admin-kit/shared: Drizzle table defs + drizzle-typebox schemas
├── docs/
│   ├── architecture.md
│   ├── conventions.md
│   ├── recipes/                # add-resource, add-protected-route, add-background-job, add-locale
│   └── decisions/              # ADRs 001-005
├── .claude/                    # settings.json (hooks, permissions), commands/, skills/
├── .mcp.json                   # context7 (live docs for fast-moving TanStack APIs)
├── CLAUDE.md                   # root memory: commands, hard rules, pointers (~60 lines max)
├── docker-compose.yml          # postgres:18 + mailpit
├── .github/workflows/ci.yml
└── biome.json, tsconfig.base.json, package.json (workspaces)
```

## 3. One-schema chain (core pattern)

Drizzle table (packages/shared) → `drizzle-typebox` → TypeBox insert/select/update schemas (packages/shared) → consumed:

1. **Elysia routes** — native validation, auto 422, auto OpenAPI
2. **FE forms** — TanStack Form via Standard Schema
3. **Eden treaty** — inferred types FE↔BE (server exports `type App`)

Adding a resource = define table once, derive everything. Recipe: docs/recipes/add-resource.md (also a Claude skill).

## 4. Backend architecture

- **Module per resource**: `routes.ts` (Elysia instance, TypeBox-validated, thin) + `service.ts` (Drizzle queries + business logic + audit calls). Modules mounted in index.ts.
- **Auth**: Better Auth at `/api/auth/*`, Drizzle adapter, cookie sessions in Postgres. Admin plugin: roles admin/member, ban, password reset. Elysia macro: `auth: true` (401 if no session), `role: 'admin'` (403). Rate limiting: Better Auth built-in on auth routes, `elysia-rate-limit` globally.
- **Audit log**: `audit_logs` table — id (uuidv7), actor_id, action (create|update|delete), resource, resource_id, before jsonb, after jsonb, created_at. Helper `audit(actor, action, resource, before, after)` called in every mutation service. Query routes for viewer (filter: actor, resource, action, date range; paginated).
- **Jobs**: pg-boss in same Postgres. v1 workers: send-email (password reset, invite). @elysiajs/cron: expired-session sweep, audit retention (configurable, default keep-all).
- **Email**: Nodemailer SMTP transport (env-configured), React Email templates (reset-password, invite). Local: Mailpit catches all.
- **Errors**: central `onError` → envelope `{ code, message }` (typed per status in route schemas where meaningful). No stack leaks. Unknown → 500 + pino error log + otel span error.
- **Observability**: pino JSON logs (request-scoped child loggers), pino-pretty dev. @elysiajs/opentelemetry → OTLP exporter, endpoint env-configured (off if unset).
- **Env**: @t3-oss/env-core with TypeBox standard-schema validation at boot; fail fast with readable message. (Fallback if combo incompatible at install: hand-rolled TypeBox Value check, ~15 lines.)
- **Security headers**: elysiajs-helmet. CORS: @elysiajs/cors restricted to web origin.
- **API docs**: @elysiajs/openapi → Scalar UI at `/api/docs` (dev + optionally prod behind auth).

## 5. Frontend architecture

- **Routing**: TanStack Router file-based. `_auth` layout (public), `_app` layout — `beforeLoad` session check → redirect to login; role-gated nav items.
- **Data**: per-resource `queryCollectionOptions` (queryFn = Eden call) → TanStack DB collection → `useLiveQuery` powers screens. Mutations via collection insert/update/delete → optimistic with rollback → Eden mutation → on error: rollback + sonner toast; 422 maps to form field errors.
- **DataTable**: shared component — TanStack Table + TanStack Virtual (virtualized rows), column sort/filter/visibility, row selection, server-driven pagination for initial load, Pacer-debounced search input feeding live-query filter.
- **Forms**: TanStack Form + shared TypeBox schemas. shadcn field components wrapped once in `components/form/`.
- **Command palette**: TanStack Hotkeys binds ⌘K (and `/` for search focus) → shadcn Command (cmdk): navigate to any screen, jump to resource records, quick actions. Mounted in `_app` layout — present on every page.
- **i18n**: Paraglide (Vite plugin), messages en/vi, typed message functions. Locale switcher in profile + persisted localStorage. Every user-facing string is a message — enforced by convention + review.
- **Theme**: ThemeProvider (class strategy), dark/light/system, persisted localStorage.
- **Dashboard**: stat cards (counts via collection/live queries) + recharts (line + bar examples).
- **Devtools**: TanStack Devtools shell (dev-only) with Query, Router, DB, Pacer panels.

## 6. Screens (v1)

Login · Forgot/Reset password · Dashboard · Products CRUD (example resource: list/create/edit/delete) · Users (list, invite, role change, ban) · Audit log viewer · Profile (name, password, language, theme)

## 7. AI development layer (ships in repo — project-scoped, nothing user-level)

- **CLAUDE.md (root)**: ≤60 lines. Commands, hard rules (TypeBox not zod; Eden not fetch; TanStack Form/DB patterns; never edit generated files: routeTree.gen.ts, src/paraglide/**, drizzle/meta/**; every mutation audits; every string is a Paraglide message), pointers to docs/.
- **apps/server/CLAUDE.md / apps/web/CLAUDE.md**: per-tree conventions, auto-loaded contextually.
- **docs/decisions/**: ADR 001 Bun over Deno/Node · 002 Elysia over Hono/tRPC/NestJS · 003 Vite SPA over Next.js · 004 TypeBox over zod · 005 TanStack DB data layer. Format: context → options → decision → consequences.
- **.claude/skills/add-resource/SKILL.md**: deterministic recipe — shared schema → server module → web collection → routes/screens → table columns → form → paraglide keys (en+vi) → nav + palette entry → audit verification.
- **.claude/commands/**: `/new-resource <name>` (invokes skill), `/db-migrate`, `/add-locale <code>`.
- **.claude/settings.json**: PostToolUse hook → biome check --write on edited files; PreToolUse guard → block Edit/Write on generated paths (exit 2, message "generated — run generator"); permissions allowlist (bun run *, drizzle-kit *, biome *).
- **.mcp.json**: context7 — live docs for fast-moving TanStack DB/Pacer/Hotkeys APIs.
- **Superpowers workflow (project-adopted)**: repo adopts superpowers conventions — specs in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`; `.claude/settings.json` ships `extraKnownMarketplaces` + `enabledPlugins` entries so superpowers is recommended/enabled at project level for anyone cloning (verify exact settings keys against current Claude Code docs at implementation). Feature work in cloned projects follows brainstorm → spec → plan → implement.

## 8. Dev environment & deploy

- `docker compose up` → postgres:18, mailpit. `bun dev` → server (watch) + web (vite) concurrently.
- `bun db:migrate` (drizzle-kit generate + migrate), `bun db:seed` (drizzle-seed: admin user, sample products), `bun check` (biome + tsc --noEmit all workspaces).
- Dockerfiles: server = oven/bun slim, `bun install --production`; web = build stage → nginx:alpine static + SPA fallback + gzip.
- CI (GitHub Actions): bun install → biome ci → typecheck → build both apps → docker build both images. No tests by design.
- Deploy target: any container PaaS; compose file documents required services (Postgres 18, SMTP).

## 9. Package manifest

**apps/server**: elysia, @elysiajs/cors, @elysiajs/openapi, @elysiajs/cron, @elysiajs/opentelemetry, better-auth, drizzle-orm, drizzle-typebox, pg-boss, nodemailer, @react-email/components, react, react-dom, pino, @bogeychan/elysia-logger, elysia-rate-limit, elysiajs-helmet, @t3-oss/env-core. Dev: drizzle-kit, drizzle-seed, pino-pretty, react-email, @types/nodemailer.

**apps/web**: react, react-dom, @tanstack/react-router, @tanstack/react-query, @tanstack/react-db, @tanstack/query-db-collection, @tanstack/react-table, @tanstack/react-form, @tanstack/react-virtual, @tanstack/react-pacer, @tanstack/react-hotkeys (alpha — verify exact name at install), @elysiajs/eden, @inlang/paraglide-js, tailwindcss, @tailwindcss/vite, class-variance-authority, clsx, tailwind-merge, tw-animate-css, lucide-react, cmdk, sonner, recharts, react-day-picker (via shadcn Calendar; brings date-fns). Radix primitives via shadcn CLI per component. Dev: vite, @vitejs/plugin-react, @tanstack/router-plugin, @tanstack/react-devtools (+ Query/Router/DB/Pacer panels).

**packages/shared**: @sinclair/typebox, drizzle-orm, drizzle-typebox.

**Root**: typescript, @biomejs/biome.

## 10. Risks accepted (newest-tech philosophy — explicit choice)

- Elysia bus-factor (mitigation: web-standard handlers, Hono migration path)
- TanStack DB/Pacer beta + Hotkeys/Devtools alpha API churn (mitigation: pinned versions, lockfile, context7 for current docs)
- Bun observability maturity (mitigation: pino + OTLP cover the need)
- t3-env + TypeBox standard-schema combo unverified (fallback documented §4)
