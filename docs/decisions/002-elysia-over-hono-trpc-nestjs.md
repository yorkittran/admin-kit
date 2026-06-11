# ADR 002: ElysiaJS over Hono, tRPC, and NestJS

## Context

The API framework must give end-to-end type safety to the React app, REST semantics for external consumers, and OpenAPI docs — without maintaining three schema layers. Decided 2026-06-10.

## Options

- **Hono** — broadest runtime portability, larger community; client typing (hc) is thinner than Eden, OpenAPI needs extra wiring.
- **tRPC** — best-in-class internal type safety; RPC-only (no REST surface, no OpenAPI without addons), couples FE/BE deploys.
- **NestJS** — batteries included, enterprise patterns; heavy DI/decorator ceremony fights the small-internal-tool profile.
- **ElysiaJS** — Eden treaty gives tRPC-grade client types over real REST routes; one TypeBox schema drives validation, types, and OpenAPI; smaller ecosystem, effectively single-maintainer.

## Decision

ElysiaJS + Eden treaty. One schema (TypeBox) produces runtime validation, static types on both sides, and `/openapi` docs.

## Consequences

- Web app imports `App` type from `@admin-kit/server` and gets a fully typed client (`apps/web/src/lib/api.ts`).
- Bus-factor risk accepted (spec §10): business logic lives in service functions, so a framework migration rewrites only the thin route layer.
- Elysia plugins (cors, openapi, cron, opentelemetry) cover the middleware needs without expressisms.
