---
name: add-resource
description: Add a new CRUD resource to admin-kit by cloning the products module shape — shared schema, server module, web collection, screen, i18n, nav, palette, audit. Use when asked to add/scaffold a new resource, entity, or CRUD module.
---

# Add a Resource

Deterministic recipe. `products` is the reference implementation — read each referenced file before writing its counterpart. Replace `<resource>` with the plural lowercase name (e.g. `orders`), `<Resource>` with PascalCase singular (e.g. `Order`).

## 1. Drizzle table — `packages/shared/src/db/<resource>.ts`

Read `packages/shared/src/db/products.ts`. Clone the shape: `pgTable` with `id` (uuid, `default(sql\`uuidv7()\`)`), domain columns, `createdAt`/`updatedAt` timestamps. For jsonb columns use the identity `customType` from `packages/shared/src/db/audit.ts` (drizzle's `jsonb` double-encodes on bun-sql). Export the table from `packages/shared/src/db/index.ts`.

## 2. TypeBox schemas — `packages/shared/src/schemas/<resource>.ts`

Read `packages/shared/src/schemas/products.ts`. Derive with drizzle-typebox: `<Resource>SelectSchema`, `<Resource>InsertSchema` (refine user-input fields with constraints like `minLength`), `<Resource>UpdateSchema` (partial). Export from `packages/shared/src/schemas/index.ts`.

## 3. Migration

Run `bun db:generate`, inspect the new SQL file in `apps/server/drizzle/`, then `bun db:migrate`. Never edit `drizzle/meta/**`.

## 4. Server module — `apps/server/src/modules/<resource>/`

Read `apps/server/src/modules/products/service.ts` and `routes.ts`. Clone both:
- `service.ts`: list/create/update/remove. **Every mutation calls `audit(actorId, action, "<resource>", id, before, after)`** from `src/audit/audit.ts`; capture `before` via `RETURNING` patterns as products does.
- `routes.ts`: Elysia module with TypeBox validation from `@admin-kit/shared`, auth macros (`{ auth: true }` for reads, `{ role: "admin" }` if writes are admin-only — match the resource's needs).
- Register in `apps/server/src/index.ts`: `.use(<resource>Module)` next to `productsModule`.

## 5. Web collection — `apps/web/src/features/<resource>/collection.ts`

Read `apps/web/src/features/products/collection.ts`. Clone: query-db-collection over the Eden client (`@/lib/api`), with `onInsert`/`onUpdate`/`onDelete` calling the API and the same error-toast pattern.

## 6. Web feature files — `apps/web/src/features/<resource>/`

Clone from products: `columns.tsx` (TanStack Table columns), `row-actions.tsx` (dropdown: edit/delete with confirm dialog), `form.tsx` (TanStack Form dialog using `@/components/form/*` wrappers, shared TypeBox schema via standard-schema bridge, sonner toasts).

## 7. Route — `apps/web/src/routes/_app/<resource>.tsx`

Read `apps/web/src/routes/_app/products.tsx`. Clone: `useLiveQuery` over the collection, shared DataTable from `@/components/data-table/`, search param handling (`q`, `new`).

## 8. i18n — `apps/web/messages/en.json` + `vi.json`

Add ALL new user-facing strings to BOTH files, following the products key naming (`nav_<resource>`, `<resource>_title`, `<resource>_created_toast`, …). Run `bun --cwd=apps/web run paraglide:compile` (or let typecheck do it). Never edit `apps/web/src/paraglide/**`.

## 9. Nav + palette

- Nav link in `apps/web/src/routes/_app.tsx` next to the products `NavLink`.
- Command palette entries in `apps/web/src/components/command-palette/command-palette.tsx`: navigation item, record-jump group (clone the products live query), and quick action (`{ new: true }`).

## 10. Verify

1. `bun run check` passes.
2. `bun dev`, log in as admin, exercise create → edit → delete in the UI; toasts appear; dashboard/table stay consistent.
3. Check audit rows: each mutation added one row visible in the Audit log screen (or `select action, resource from audit_logs order by created_at desc limit 5`).
4. Switch locale to vi — every new string renders translated, none fall back to raw keys.

Work through the steps in order; steps 1–3 must land before 4 (server imports the table), and 4 before 5 (collection calls the routes).
