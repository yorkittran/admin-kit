# ADR 004: TypeBox over zod

## Context

Validation schemas must work natively in Elysia (which validates with TypeBox/JSON Schema internally), derive from Drizzle tables, and feed TanStack Form on the client. Decided 2026-06-10.

## Options

- **zod** — biggest ecosystem and DX mindshare; Elysia would convert zod → JSON Schema at runtime, and drizzle-zod is a second derivation path from the one we need for OpenAPI.
- **TypeBox** — IS JSON Schema (zero conversion in Elysia, exact OpenAPI output); drizzle-typebox derives schemas from tables; smaller ecosystem, clunkier custom error messages.

## Decision

TypeBox. Elysia's native schema language; one derivation chain: Drizzle table → drizzle-typebox → route validation → OpenAPI → client types.

## Consequences

- All schemas live in `packages/shared/src/schemas/`, derived from the Drizzle tables in `packages/shared/src/db/`.
- Client-side TanStack Form consumes TypeBox through the standard-schema bridge (`packages/shared/src/lib/standard-schema.ts`).
- Default validation messages are raw English JSON-Schema phrasing (e.g. "Expected string length greater or equal to 1") — localizing them is future work, tracked in the spec.
- Never introduce zod; mixed schema libraries defeat the single-source chain.
