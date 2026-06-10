# admin-kit

Boilerplate for internal management systems. Bun · Elysia · Eden · Vite · React 19 · TanStack · Drizzle · Postgres 18 · shadcn/ui.

## Quick start

```bash
cp .env.example .env && cp apps/web/.env.example apps/web/.env
docker compose up -d        # postgres 18 + mailpit (http://localhost:8025)
bun install
bun run db:migrate
bun dev                     # server :3000 (+ /openapi docs), web :5173
```

## Docs

- Spec: docs/superpowers/specs/
- Plans: docs/superpowers/plans/
- Decisions (ADRs): docs/decisions/ (added in plan 05)
