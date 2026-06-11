# apps/server — ElysiaJS API

## Module pattern

Each resource = `src/modules/<name>/routes.ts` (Elysia instance: routing, TypeBox validation, auth macros) + `src/modules/<name>/service.ts` (logic + audit). Register the module in `src/index.ts` with `.use(<name>Module)`.

## Conventions

- Auth macros (defined in `src/auth/plugin.ts`): `{ auth: true }` resolves the session or returns 401; `{ role: "admin" }` additionally returns 403 for non-admins. Use them in route options — never check sessions manually.
- Validation schemas come from `@admin-kit/shared` — never define TypeBox schemas inline in routes.
- **Every create/update/delete calls `audit(actorId, action, resource, resourceId, before, after)`** from `src/audit/audit.ts`. Capture `before` via `RETURNING` in the same statement where possible — separate select-then-update can snapshot stale state (see comment in `src/modules/products/service.ts`).
- New env vars go in `src/lib/env.ts` (TypeBox + `@sinclair/typebox/value` `Value.Parse`) AND `.env.example`. Bun loads `.env` from this package's cwd only.
- Error envelope is `{ code, message }`; exceptions: rate limiter 429 and auth-macro 401/403 are plain text. VALIDATION (422) passes through untouched — Elysia's default 422 shape is mapped by the frontend.

## Drizzle / bun-sql gotchas

- jsonb columns: use the identity `customType` pattern from `packages/shared/src/db/audit.ts` — drizzle's built-in `jsonb` double-encodes on the bun-sql driver.
- Migrations: `bun db:generate` then `bun db:migrate` from the repo root. Never edit `drizzle/meta/**`.
