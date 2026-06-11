---
description: Generate and apply Drizzle migrations from current schema changes
---

Run `bun db:generate`. If it reports no schema changes, say so and stop. Otherwise show me the generated SQL file under `apps/server/drizzle/`, then run `bun db:migrate` and confirm it applied. Never edit files under `apps/server/drizzle/meta/`.
