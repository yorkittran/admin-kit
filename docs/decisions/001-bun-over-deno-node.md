# ADR 001: Bun over Deno and Node

## Context

The boilerplate needs one JS runtime for the API server, the monorepo workspace manager, and the script runner. Decided 2026-06-10.

## Options

- **Node.js** — safest ecosystem compatibility; slowest startup, needs tsx/ts-node for TS, npm/pnpm as a separate tool.
- **Deno** — best security model and built-in TS; company layoffs and product pivots in 2025 raised maintenance-health concerns, and npm interop still has friction.
- **Bun** — fastest startup and test runner, first-class TS, built-in bundler, workspaces, and `bun-sql` Postgres driver; younger ecosystem with occasional driver-level quirks.

## Decision

Bun. The boilerplate optimizes for DX and velocity on internal tools; Bun runs TS directly, manages the workspace, and replaces several tools at once.

## Consequences

- One toolchain: `bun install`, `bun run`, `bun --watch`, workspaces — no npm/pnpm/tsx.
- Driver-level quirks surface earlier than on Node (e.g. drizzle's built-in `jsonb` double-encodes on bun-sql; we use an identity customType — see `packages/shared/src/db/audit.ts`).
- `bun --cwd=<dir>` requires the `=` form; the space form silently no-ops.
- Bun loads `.env` from the package cwd only — server env lives at `apps/server/.env`.
