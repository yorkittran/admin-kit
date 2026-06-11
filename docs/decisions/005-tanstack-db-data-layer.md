# ADR 005: TanStack DB as the client data layer

## Context

Screens need server state with optimistic mutations, cross-screen consistency (palette search, dashboard stats, tables all read products), and live derived queries. Decided 2026-06-10.

## Options

- **TanStack Query alone** — proven; but optimistic updates, cross-screen derivation, and client-side joins are hand-rolled per screen.
- **TanStack DB (beta) + query-db-collection** — collections sync via Query under the hood; live queries with joins/aggregates; optimistic mutations built in; beta API churn risk.

## Decision

TanStack DB collections over Eden-fetched data (query-db-collection). Newest-tech philosophy explicitly accepts beta risk (spec §10) — versions pinned, context7 MCP configured for current docs.

## Consequences

- One collection per resource (`apps/web/src/features/<resource>/collection.ts`); screens use `useLiveQuery`, never raw `useQuery`, for resource data.
- Dashboard stats and charts derive from the same collection — zero extra endpoints.
- Mutations go through collection `onInsert/onUpdate/onDelete` handlers calling Eden; optimistic rollback is automatic.
- Beta upgrades may need API migration; check context7 before relying on memorized APIs.
