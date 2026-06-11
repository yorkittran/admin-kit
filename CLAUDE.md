# admin-kit

Boilerplate for internal management systems. Bun workspaces monorepo: `apps/server` (ElysiaJS), `apps/web` (Vite + React 19 + TanStack), `packages/shared` (Drizzle tables + TypeBox schemas).

## Commands

- `docker compose up -d` — Postgres 18 + Mailpit
- `bun dev` — server (:3000) + web (:5173), watch mode
- `bun run check` — biome + typecheck all workspaces; run before every commit
- `bun db:generate` / `bun db:migrate` / `bun db:seed`
- `bun --cwd=apps/web run build` — web build (also regenerates routeTree.gen.ts)

## Hard rules

- **TypeBox, not zod.** Schemas live in `packages/shared/src/schemas/`, derived from Drizzle tables via drizzle-typebox.
- **Eden treaty, not fetch.** The web app talks to the API only through `apps/web/src/lib/api.ts`.
- **TanStack DB collections, not raw queries.** Screen data comes from `apps/web/src/features/*/collection.ts` live queries.
- **Forms use the wrappers in `apps/web/src/components/form/`** — never hand-roll fields.
- **Every mutation writes an audit row** — call `audit()` from `apps/server/src/audit/audit.ts` in the service layer.
- **Every user-facing string is a Paraglide message** — add to `apps/web/messages/en.json` AND `vi.json`, render with `m.key()`.
- **Never edit generated files**: `apps/web/src/routeTree.gen.ts`, `apps/web/src/paraglide/**`, `apps/server/drizzle/meta/**`. Run the generator instead (a PreToolUse hook enforces this).
- `bun --cwd=apps/...` — the `=` form is required; the space form silently no-ops.
- Stop the web dev server before git branch operations — the router plugin scaffolds stubs over briefly-missing route files.

## Adding a resource

Use the add-resource skill (`/new-resource <name>`) — a deterministic recipe that clones the products module shape end to end.

## Docs

- `docs/decisions/` — ADRs for every stack choice (read before proposing stack changes)
- `docs/superpowers/specs/` + `docs/superpowers/plans/` — feature workflow: brainstorm → spec → plan → implement
- `README.md` — full clone-the-shape walkthrough
