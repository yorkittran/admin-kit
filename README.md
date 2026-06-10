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

## Docs

- Spec: docs/superpowers/specs/
- Plans: docs/superpowers/plans/
- Decisions (ADRs): docs/decisions/ (added in plan 05)
