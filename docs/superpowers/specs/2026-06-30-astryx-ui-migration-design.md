# Astryx UI migration — design

Date: 2026-06-30

## Context

Migrate the `apps/web` UI from **shadcn/ui (Radix + Tailwind v4 + cva)** to
**Astryx** (`facebook/astryx`, https://astryx.atmeta.com), Meta's open-source
design system — 150+ accessible React components built on StyleX, themeable,
with a CLI designed for both humans and agents. Astryx is currently in **Beta**.

Decisions (all confirmed with the user):

- **Scope: full migration.** Replace shadcn/Radix everywhere; no long-term
  coexistence of two component systems.
- **Strategy: big-bang rewrite** on a feature branch. Mid-flight the app may not
  compile; the final gate is `bun run check` green + manual app run.
- **Theme: `@astryxdesign/theme-neutral`**, light + dark. Dark mode moves to
  Astryx's native theming (replaces the current `theme-provider`/`mode-toggle`).
- This is a stack change → it gets an ADR (`006`) and supersedes the shadcn rule
  in `CLAUDE.md` / `apps/web/CLAUDE.md`.

Acknowledged risk: betting a reusable boilerplate on a Beta dependency. Mitigated
by front-loading a verification spike (below) and keeping the change on a branch
with a clean ADR so it is reversible.

### What is explicitly NOT changing

The migration swaps **rendering only**. Untouched:

- TanStack DB collections (`features/*/collection.ts`) and all reads/writes.
- Server services and the **audit** row written by every mutation.
- Eden treaty client (`lib/api.ts`) and auth client (`lib/auth-client.ts`).
- TanStack Router file-based routing and the generated `routeTree.gen.ts`.
- Paraglide i18n: every user-facing string stays `m.key()`; no hardcoded text is
  introduced in any rewritten component, and no catalog keys are removed.

## Current UI surface (what gets touched)

- **`src/components/ui/` (15 shadcn files):** alert-dialog, badge, button, card,
  chart, checkbox, command, dialog, dropdown-menu, input, label, select, sonner,
  table, textarea.
- **Form wrappers (`src/components/form/`):** field-errors, number-field,
  select-field, text-field, textarea-field.
- **Other components:** `data-table/` (data-table, sortable-header),
  `command-palette/`, `theme-provider`, `mode-toggle`, `locale-switcher`.
- **Routes (10):** `__root`, `_app`, `_app/{index, products, users, profile,
  audit-log}`, `_auth`, `_auth/{login, forgot-password, reset-password}`.
- **Features:** `products/` (collection, columns, form, row-actions).
- ~25 files import from `components/ui`. Dep usage: radix 8 files, sonner 7,
  lucide 12, recharts 2, cmdk 1, cva 2.

## Build + dependencies

- Create branch `feat/astryx-ui`. **Stop the web dev server first** — the router
  plugin scaffolds stubs over briefly-missing route files during branch ops.
- Add deps to `apps/web`: `@astryxdesign/core`, `@astryxdesign/theme-neutral`;
  dev: `@astryxdesign/cli`. Add an `astryx` script per Astryx docs
  (`node node_modules/@astryxdesign/cli/bin/astryx.mjs`).
- Run `npx astryx init` (AI agent docs + theming setup).
- `src/styles.css`: import Astryx CSS —
  `@astryxdesign/core/reset.css`, `@astryxdesign/core/astryx.css`,
  `@astryxdesign/theme-neutral/theme.css`.
- **Remove** once nothing imports them: `radix-ui`, `cmdk`, `sonner`,
  `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`.
- **Keep**: `tailwindcss` (incidental layout utilities only), `recharts`
  (Astryx has no charts), `lucide-react` (glyph source for Astryx `<Icon>` —
  see Icons), all `@tanstack/*`, better-auth, paraglide.
- **Icons** (REVISED after Task 1 — Astryx `Icon` has only ~25 semantic names):
  every glyph renders through Astryx `<Icon>`. Use a semantic name where one
  fits (`<Icon icon="search" />`); for glyphs Astryx doesn't name (sun, moon,
  dashboard, package, users, …) pass the lucide SVG component into
  `<Icon icon={LucideComp} />` — Astryx's own documented pattern. So
  `lucide-react` is **retained** as a glyph source, not removed.

## Verification spike (FIRST step, gates the rest)

The Astryx docs claim "no build plugin, no PostCSS or Babel config" — StyleX
ships pre-compiled. Before rewriting anything, verify in this repo:

1. Astryx core renders under **Vite 7 + React 19** (a throwaway route mounting a
   few Astryx components; CSS imports resolve; no build error).
2. Astryx `Table` markup can host **TanStack Virtual** rows + **TanStack Table**
   headers without breaking virtualization/sorting.
3. Astryx native dark-mode toggling mechanism is identified (class vs data-attr
   on `<html>`) so `theme-provider`/`mode-toggle` can be replaced cleanly.

If any of these fail, the migration approach is revised here before proceeding
(e.g. a StyleX build plugin is in fact required, or DataTable keeps custom
markup). The spike result is recorded in the implementation plan.

## Component mapping (shadcn → Astryx)

Delete `src/components/ui/`; replace call sites with Astryx imports.

| shadcn (delete) | Astryx replacement |
|---|---|
| button | Button / Icon Button |
| badge | Badge |
| card | Card |
| checkbox | Checkbox Input |
| dialog | Dialog |
| alert-dialog | Dialog (confirm variant) |
| dropdown-menu | Dropdown Menu / More Menu |
| select | Selector |
| input | Text Input |
| textarea | Text Area |
| label | Field (label folded in) |
| command | Command Palette (replaces cmdk) |
| table | Table (rendering only) |
| sonner | Toast (replaces sonner) |
| chart | **No Astryx equivalent → keep recharts**; restyle the wrapper to Astryx design tokens |

## Headless logic preserved (swap rendering only)

- **DataTable** (`data-table.tsx`, `sortable-header.tsx`): keep TanStack Table +
  Virtual + Pacer-debounced search; render rows/headers with Astryx `Table`.
  New list screens still reuse this shared DataTable.
- **Form wrappers**: rebuild over Astryx `Field` + inputs, keeping TanStack Form
  and TypeBox validation via the standard-schema bridge. Astryx `Field` renders
  label + error, so `field-errors` is likely folded into the wrappers (verify
  error-shape parity for both array and string validator errors). Hard rule
  stands: screens never hand-roll fields.
- **Command palette**: keep the TanStack Router action wiring; render via Astryx
  Command Palette.

## Shell + theme

- `theme-provider` + `mode-toggle` → Astryx native theming + dark-mode toggle.
- `_app.tsx` authenticated shell (nav + command palette + theme) → Astryx
  `App Shell` / `Side Nav` / `Top Nav`.
- `locale-switcher` stays (Paraglide-driven), re-skinned with Astryx controls.

## Screens rewritten (render only; data + routing unchanged)

`_app/{index, products, users, profile, audit-log}`, `_auth/{login,
forgot-password, reset-password}`, `_app.tsx`, `_auth.tsx`, `__root.tsx`, plus
`features/products/{columns, form, row-actions}`. `index.tsx` keeps recharts for
its dashboard charts.

## Documentation changes

- New ADR `docs/decisions/006-astryx-over-shadcn.md`: rationale, Beta-risk
  acknowledgement, reversibility. Explicitly supersedes the shadcn guidance.
- Update `CLAUDE.md` and `apps/web/CLAUDE.md`: replace the
  "add with `bunx shadcn@latest add`" rule with the Astryx CLI workflow
  (`npx astryx component <name>` for props/usage; never hand-write component
  internals). Keep the forms / tables / i18n / audit rules intact.

## Success criteria (final gate)

1. `bun run check` (biome + typecheck, all workspaces) is green.
2. No remaining imports of `radix-ui`, `cmdk`, `sonner`, `cva`, or
   `components/ui`; those deps removed from `apps/web/package.json`.
   (`lucide-react` is retained — but every lucide import must be wrapped by
   Astryx `<Icon icon={…}>`, never rendered raw.)
3. App runs and, by manual check:
   - every screen renders in light **and** dark mode;
   - forms validate and submit (create/update product, profile, auth flows);
   - DataTable sorts, searches, and virtualizes;
   - command palette opens and navigates;
   - toasts fire on mutations;
   - dashboard charts still render.
4. No user-facing string regressed to hardcoded text (all via `m.*()`).
5. Mutations still write audit rows (server unchanged — confirm one path).
