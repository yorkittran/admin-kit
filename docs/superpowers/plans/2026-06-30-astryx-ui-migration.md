# Astryx UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `apps/web` UI foundation (shadcn/ui + Radix + cmdk + sonner + lucide) with Astryx (`@astryxdesign/*`), Meta's StyleX-based design system, keeping all data/routing/i18n/audit behavior identical.

**Architecture:** Big-bang rewrite on branch `feat/astryx-ui` (already created). Swap rendering only — TanStack DB collections, server services, Eden treaty, TanStack Router, TanStack Table/Form/Virtual logic, and Paraglide messages are untouched. Astryx ships pre-compiled CSS (no StyleX build plugin per docs); a Task 1 spike verifies that claim under Vite 7 + React 19 before any rewrite.

**Tech Stack:** React 19, Vite 7, TanStack (Router/DB/Query/Table/Virtual/Form/Pacer), Astryx (`@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@astryxdesign/cli`), recharts (charts only), Paraglide (i18n), better-auth.

**Spec:** `docs/superpowers/specs/2026-06-30-astryx-ui-migration-design.md`

## Global Constraints

- **Astryx is BETA — never guess its API.** Before using any Astryx component, run `npm run astryx -- component <Name>` (set up in Task 1) to read its real props/usage, and follow that output. This plan shows the **current shadcn code to replace** and the **behavior to preserve**; Astryx JSX is described by intent + the props you must wire, because the exact API is discovered at execution time.
- **Big-bang reality:** mid-migration `tsc` will report errors in not-yet-migrated files. Per task, the task's own files must be error-free; pre-existing errors elsewhere are expected until Task 11. Only Task 11 requires a fully green `bun run check`.
- **No automated tests** (repo decision). Verification = scoped typecheck + running the app (`bun dev`, open the screen). Never add test files.
- **i18n:** every user-facing string stays a Paraglide message `m.key()` from `@/paraglide/messages`. Do not hardcode text; do not add/remove catalog keys (the same keys already exist in `messages/en.json` + `vi.json`).
- **Forms:** screens never hand-roll fields — only the wrappers in `src/components/form/`. Preserve each wrapper's prop interface (`field: AnyFieldApi`, `label`, etc.) so call sites are unchanged.
- **Icons:** every glyph renders through Astryx `<Icon>` (for theme-aware color + size tokens + a11y). Astryx has only ~25 **semantic** icon names (close, chevron*, check, success, error, warning, info, calendar, clock, externalLink, menu, moreHorizontal, search, arrowUp, arrowDown, arrowsUpDown, funnel, eyeSlash, viewColumns, copy, checkDouble, wrench, stop, microphone). Use a semantic name where one fits (`<Icon icon="search" />`); for any glyph with no semantic name (sun, moon, dashboard, package, users, etc.) pass the **lucide-react SVG component** into `<Icon icon={LucideComp} />` — this is Astryx's documented pattern, so **lucide-react STAYS** as a glyph source (do NOT remove it). Never define icon component-functions inside a render body; import the lucide component (or hoist to module scope) so the reference is stable.
- **Commands use the `--cwd=` form:** `bun --cwd=apps/web ...` (the space form silently no-ops).
- **Stop the web dev server before any git branch operation** (router plugin scaffolds stubs over missing route files).
- **Commit message footer** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```

---

### Task 1: Setup, dependency install, and verification spike (GATE)

This task gates the entire migration. If the spike fails (Astryx needs a build plugin under Vite 7, or its `Table` can't host TanStack Virtual), **stop and revise the spec** before continuing.

**Files:**
- Modify: `apps/web/package.json` (deps + `astryx` script)
- Modify: `apps/web/src/styles.css` (Astryx CSS imports)
- Create: `apps/web/src/routes/_app/astryx-sandbox.tsx` (throwaway probe route — deleted in Task 11)

**Interfaces:**
- Produces: working Astryx install; the documented dark-mode mechanism (CSS class vs `data-*` attribute on `<html>`) recorded in this task's commit message and reused by Task 2; a proven Table+Virtual pattern reused by Task 5.

- [ ] **Step 1: Confirm the dev server is stopped, confirm branch**

Run: `pgrep -fl vite || echo stopped` → expect `stopped`. Run: `git branch --show-current` → expect `feat/astryx-ui`.

- [ ] **Step 2: Install Astryx packages**

```bash
bun --cwd=apps/web add @astryxdesign/core @astryxdesign/theme-neutral
bun --cwd=apps/web add -D @astryxdesign/cli
```

- [ ] **Step 3: Add the CLI script to `apps/web/package.json`**

Add to `"scripts"`:
```json
"astryx": "node node_modules/@astryxdesign/cli/bin/astryx.mjs"
```
Verify: `bun --cwd=apps/web run astryx -- component --list` prints the component inventory.

- [ ] **Step 4: Run the Astryx initializer**

```bash
cd apps/web && npx astryx init
```
Accept AI-agent-docs setup; when prompted for a theme, choose **neutral**; skip starter-template scaffolding (we have our own screens). Note where it writes agent docs.

- [ ] **Step 5: Wire Astryx CSS into `styles.css`**

At the TOP of `apps/web/src/styles.css`, before `@import "tailwindcss";`, add the Astryx imports (exact paths per `npx astryx docs theming`):
```css
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";
```
Remove `@import "tw-animate-css";` (dep is dropped in Task 11). Keep the Tailwind import and the `body { @apply ... }` rule for now (layout utilities still used until screens are migrated).

- [ ] **Step 6: Create the probe route**

`apps/web/src/routes/_app/astryx-sandbox.tsx` — a `createFileRoute("/_app/astryx-sandbox")` route whose component renders a handful of Astryx components discovered via the CLI: a `Button`, a `Card`, a `Text Input` inside a `Field`, a `Dialog` trigger, and a small Astryx `Table` (3 static rows) wrapped in a TanStack `useVirtualizer` to prove virtualization works inside Astryx table markup. Get each component's props from `npm run astryx -- component <Name>` first.

- [ ] **Step 7: Run the app and verify the spike**

```bash
bun --cwd=apps/web run dev
```
Open `http://localhost:5173/astryx-sandbox`. Verify: page renders with Astryx styling, no console/build errors, the virtualized Astryx table scrolls. Toggle the OS/browser dark mode (or flip the html class/attr in devtools) and confirm theme-neutral dark styles apply — **record the exact dark-mode mechanism** (e.g. `class="dark"` vs `data-theme="dark"` on `<html>`).

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/web/bun.lock apps/web/src/styles.css apps/web/src/routes/_app/astryx-sandbox.tsx
git commit -m "feat(web): install Astryx + verification spike

Dark-mode mechanism: <record here>. Table+Virtual: verified.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Theme provider + mode toggle on Astryx

**Files:**
- Modify: `apps/web/src/components/theme-provider.tsx`
- Modify: `apps/web/src/components/mode-toggle.tsx`

**Interfaces:**
- Consumes: dark-mode mechanism from Task 1.
- Produces: `ThemeProvider`, `useTheme()` (unchanged signature: `{ theme, setTheme }`, `Theme = "dark" | "light" | "system"`), `ModeToggle`. Consumed by `command-palette` (Task 5), `_app` (Task 8), `__root` (Task 8).

- [ ] **Step 1: Adapt `theme-provider.tsx` to Astryx's mechanism**

Keep the entire file's logic (localStorage persistence under `admin-kit-theme`, `system` resolution via `matchMedia`, the context). Change ONLY the `applyResolved()` body so it applies Astryx's dark-mode mechanism recorded in Task 1 instead of `root.classList.remove/add("light","dark")`. If Astryx uses `<html class="dark">`, the current code already works as-is — keep it. If Astryx uses `data-theme`, switch to `root.setAttribute("data-theme", resolved)`.

Current `applyResolved` (lines 50-59):
```tsx
const applyResolved = () => {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
};
```

- [ ] **Step 2: Rewrite `mode-toggle.tsx` over Astryx**

Replace shadcn `Button` + `DropdownMenu` (+ lucide `Sun`/`Moon`) with Astryx `Dropdown Menu` (or `More Menu`) triggered by an Astryx `Icon Button` showing an Astryx sun/moon icon. Keep `useTheme()` usage and the three items calling `setTheme("light"|"dark"|"system")` with labels `m.theme_light()`, `m.theme_dark()`, `m.theme_system()`. Get props via `npm run astryx -- component "Dropdown Menu"` and `component "Icon Button"`.

- [ ] **Step 3: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors in `theme-provider.tsx` / `mode-toggle.tsx` (errors elsewhere expected). Run `bun --cwd=apps/web run dev`, open the sandbox route, toggle theme via the new `ModeToggle`, confirm light/dark switch and persistence across reload.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/theme-provider.tsx apps/web/src/components/mode-toggle.tsx
git commit -m "feat(web): theme provider + mode toggle on Astryx

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Form field wrappers on Astryx

**Files:**
- Modify: `apps/web/src/components/form/field-errors.tsx`
- Modify: `apps/web/src/components/form/text-field.tsx`
- Modify: `apps/web/src/components/form/number-field.tsx`
- Modify: `apps/web/src/components/form/textarea-field.tsx`
- Modify: `apps/web/src/components/form/select-field.tsx`

**Interfaces:**
- Produces (prop interfaces UNCHANGED so call sites don't break):
  - `TextField({ field, label, type?, placeholder?, autoComplete? })`
  - `NumberField({ field, label, min?, step? })`
  - `TextareaField({ field, label, placeholder? })`
  - `SelectField({ field, label, options: ReadonlyArray<{value,label}>, placeholder? })`
  - `FieldErrors({ field })`
- `field` is `AnyFieldApi` from `@tanstack/react-form`. Wiring to preserve in every wrapper: `value` from `field.state.value`, `onBlur={field.handleBlur}`, `onChange`→`field.handleChange(...)`, `id={field.name}`.

- [ ] **Step 1: Decide error handling — inspect Astryx `Field`**

Run `npm run astryx -- component Field`. Astryx `Field` renders label + error/help text. Two outcomes:
  - If `Field` accepts an `error`/`invalid` prop: fold error rendering into each wrapper via `Field`, and reduce `FieldErrors` to a pure helper that computes the error string (keep the `message()` logic), OR keep `FieldErrors` rendering an Astryx error element.
  - Preserve the exact current logic: show errors only when `field.state.meta.isTouched && !field.state.meta.isValid`, joining `field.state.meta.errors.map(message)` with `", "`. Keep the `message()` function verbatim (handles both string and `{message}` issue shapes):
    ```tsx
    function message(error: unknown): string {
      if (typeof error === "string") return error;
      if (error && typeof error === "object" && "message" in error) {
        return String((error as { message: unknown }).message);
      }
      return "Invalid value";
    }
    ```

- [ ] **Step 2: Rewrite `text-field.tsx`**

Replace shadcn `Label` + `Input` with Astryx `Field` wrapping an Astryx `Text Input`. Preserve props/wiring:
```tsx
// current wiring to preserve:
id={field.name} type={type} placeholder={placeholder} autoComplete={autoComplete}
value={(field.state.value as string | null | undefined) ?? ""}
onBlur={field.handleBlur}
onChange={(e) => field.handleChange(e.target.value)}
```
Map `label` → Astryx `Field` label prop; wire the error from Step 1.

- [ ] **Step 3: Rewrite `number-field.tsx`**

Astryx `Field` + `Number Input`. Preserve: `type="number"`, `min`, `step`, `value ?? 0`, `onChange={(e)=>field.handleChange(Number(e.target.value))}`, `onBlur`. (If Astryx `Number Input` emits a numeric value directly rather than an event, adapt `onChange` to call `field.handleChange(value)` — confirm via CLI.)

- [ ] **Step 4: Rewrite `textarea-field.tsx`**

Astryx `Field` + `Text Area`. Preserve `placeholder`, `value ?? ""`, `onBlur`, `onChange`.

- [ ] **Step 5: Rewrite `select-field.tsx`**

Astryx `Field` + `Selector`. Map `options` to the Selector's item API. Preserve `value ?? ""`, change handler → `field.handleChange(value)`, `onBlur={field.handleBlur}`, `placeholder`.

- [ ] **Step 6: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors within `components/form/**`. Defer visual check to Task 8 (products form renders these). Optionally drop one of each field into the sandbox route to eyeball rendering.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/form
git commit -m "feat(web): form field wrappers on Astryx Field/inputs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: DataTable + sortable header on Astryx Table

**Files:**
- Modify: `apps/web/src/components/data-table/data-table.tsx`
- Modify: `apps/web/src/components/data-table/sortable-header.tsx`

**Interfaces:**
- Produces (UNCHANGED): `DataTable<TData>({ columns, data, getRowId, onSearchChange, searchPlaceholder, initialSearch?, toolbar? })` and the sortable header helper. Consumed by `products` columns/route (Task 8).
- Logic to preserve verbatim: `useReactTable` config, `useDebouncedValue(search, {wait:300, key:"datatable-search"})`, the `onSearchChangeRef` effect, `useVirtualizer({count, getScrollElement, estimateSize:()=>49, overscan:10})`, the `paddingTop`/`paddingBottom` spacer rows, `data-slot="datatable-search"` on the search input (the command palette's `/` hotkey focuses it), and the `m.datatable_*` messages.

- [ ] **Step 1: Rewrite the toolbar**

Replace the shadcn search `Input` with an Astryx `Text Input` (keep `data-slot="datatable-search"`, `value`, `onChange`, `placeholder={searchPlaceholder}`). Replace the column-visibility shadcn `DropdownMenu` + `Button` (+ lucide `Columns3`) with an Astryx `Dropdown Menu` of checkbox items bound to `column.getIsVisible()` / `column.toggleVisibility(!!value)`, triggered by an Astryx `Button` with an Astryx columns icon and label `m.datatable_columns()`. Keep `{toolbar}` slot.

- [ ] **Step 2: Rewrite the table body**

Replace shadcn `TableHeader/TableRow/TableHead/TableBody/TableCell` with Astryx `Table` primitives (get the subcomponent names via `npm run astryx -- component Table`). Keep:
  - the scroll container `<div ref={containerRef} className="h-[32rem] overflow-auto ...">` (virtualization needs a fixed-height scroll parent),
  - the sticky header,
  - `flexRender(header.column.columnDef.header, header.getContext())` and the cell equivalent,
  - the `paddingTop`/`paddingBottom` spacer rows using `colSpan={visibleColumnCount}`,
  - the empty state `m.datatable_no_results()`,
  - the footer `m.datatable_selected({ selected, total })`.
  If Astryx `Table` doesn't accept raw `colSpan` spacer rows, keep a plain `<tr><td>` spacer inside the Astryx table body (the spike in Task 1 confirms what works).

- [ ] **Step 3: Rewrite `sortable-header.tsx`**

Read it first (`apps/web/src/components/data-table/sortable-header.tsx`). Replace its shadcn `Button` + lucide sort icons (`ArrowUp`/`ArrowDown`/etc.) with an Astryx `Button`/`Icon Button` + Astryx sort icons, preserving the `column.toggleSorting(...)` / `column.getIsSorted()` wiring and its label prop.

- [ ] **Step 4: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors in `data-table/**`. Visual check deferred to Task 8 (products list). The full sort/search/virtualize check is in Task 11.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/data-table
git commit -m "feat(web): DataTable rendering on Astryx Table (TanStack logic preserved)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Command palette on Astryx Command Palette

**Files:**
- Modify: `apps/web/src/components/command-palette/command-palette.tsx`

**Interfaces:**
- Produces (UNCHANGED): `CommandPalette({ isAdmin: boolean })`. Consumed by `_app` (Task 8).
- Preserve verbatim: `useHotkey("Mod+K", ...)` toggle, `useHotkey("/", ...)` focusing `[data-slot="datatable-search"]`, the `useLiveQuery` product search over `productsCollection` with `ilike(p.name, \`%${search}%\`)`, the `run()`/`go()` helpers, navigation targets, and every `m.*` message and the `authClient.signOut()` action.

- [ ] **Step 1: Rewrite using Astryx Command Palette**

Run `npm run astryx -- component "Command Palette"`. Replace the shadcn/cmdk `CommandDialog/CommandInput/CommandList/CommandEmpty/CommandGroup/CommandItem/CommandSeparator` with the Astryx equivalents. Map:
  - `open`/`onOpenChange` (clear `search` on close),
  - `title={m.palette_title()}`, `description={m.palette_description()}`,
  - input: `placeholder={m.palette_placeholder()}`, `value={search}`, change→`setSearch`,
  - groups: Navigation (`m.palette_navigation()`), conditional product matches (`m.palette_products()`), Actions (`m.palette_actions()`),
  - each item's `onSelect`→`run(...)`, replacing lucide icons (`LayoutDashboard`,`Package`,`Users`,`ScrollText`,`User`,`ListChecks`,`Plus`,`Sun`,`Moon`,`Languages`) with Astryx `Icon`s.

- [ ] **Step 2: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors in `command-palette.tsx`. Visual check deferred to Task 8/11 (needs the `_app` shell to mount it). Confirm `⌘K` opens it once the shell is migrated.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/command-palette
git commit -m "feat(web): command palette on Astryx (replaces cmdk)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Toasts on Astryx Toast

**Files:**
- Modify: `apps/web/src/routes/__root.tsx` (toaster mount)
- Modify: `apps/web/src/features/products/form.tsx`
- Modify: `apps/web/src/features/products/row-actions.tsx`
- Modify: `apps/web/src/routes/_app/profile.tsx`
- Modify: `apps/web/src/routes/_app/users.tsx`
- Modify: `apps/web/src/routes/_auth/reset-password.tsx`
- Delete (in Task 11): `apps/web/src/components/ui/sonner.tsx`

**Interfaces:**
- Produces: a single `toast` helper API. Run `npm run astryx -- component Toast` first. If Astryx Toast is imperative with a different name (e.g. `notify(...)`), create a thin shim `apps/web/src/lib/toast.ts` exporting `toast` with `.success`/`.error` matching current call sites, so the 5 call-site files change only their import. If Astryx exposes a sonner-compatible `toast`, just change imports.

- [ ] **Step 1: Inspect current usage**

Read the `toast(...)` calls in the 5 call-site files (`grep -n "toast" <files>`). Note which use `toast.success` / `toast.error` / bare `toast`.

- [ ] **Step 2: Mount the Astryx toaster in `__root.tsx`**

Read `__root.tsx`; replace the shadcn `<Toaster />` (from `components/ui/sonner`) with the Astryx toaster/region component (per CLI). Keep its position/theme consistent with the app theme.

- [ ] **Step 3: Provide the `toast` API**

Either create `apps/web/src/lib/toast.ts` re-exporting Astryx's toast under a sonner-shaped `toast` (with `success`/`error`), or confirm Astryx's export is drop-in. Update the 5 call-site imports from `sonner` → the chosen source. Keep every message argument (`m.*`) identical.

- [ ] **Step 4: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors in the touched files. Defer firing a real toast to Task 11.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/__root.tsx apps/web/src/features/products apps/web/src/routes/_app/profile.tsx apps/web/src/routes/_app/users.tsx apps/web/src/routes/_auth/reset-password.tsx apps/web/src/lib/toast.ts
git commit -m "feat(web): toasts on Astryx Toast (replaces sonner)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: App shell, auth shell, root, locale switcher

**Files:**
- Modify: `apps/web/src/routes/_app.tsx`
- Modify: `apps/web/src/routes/_auth.tsx`
- Modify: `apps/web/src/routes/__root.tsx` (any remaining shadcn usage beyond the toaster)
- Modify: `apps/web/src/components/locale-switcher.tsx`

**Interfaces:**
- Consumes: `ModeToggle` (Task 2), `CommandPalette` (Task 5).
- Preserve: `_app` `beforeLoad` session guard + redirect, `isAdmin` nav gating, `signOut()`, all `m.nav_*` labels, and the `<CommandPalette isAdmin={isAdmin} />` mount.

- [ ] **Step 1: Rewrite `_app.tsx` shell**

Run `npm run astryx -- component "App Shell"` and `component "Side Nav"`. Replace the hand-built `<aside>` + `<main>` + `NavLink` layout with Astryx `App Shell` / `Side Nav` / `Top Nav`. Keep TanStack Router `<Link>` for nav items (wrap in Astryx nav-item styling), the `admin-kit` brand label, the admin-gated `/users` + `/audit-log` links, `ModeToggle`, the sign-out `Icon Button` (Astryx logout icon, `aria-label={m.nav_sign_out()}`), `<Outlet/>`, and the `<CommandPalette>` mount.

- [ ] **Step 2: Rewrite `_auth.tsx` shell**

Read it first. Re-skin the guest layout (centered card) with Astryx `Card`/`Layout`. Preserve any redirect-if-authenticated logic and the `<Outlet/>`.

- [ ] **Step 3: Rewrite `locale-switcher.tsx`**

Read it first. Replace its shadcn control (likely `Select`/`DropdownMenu`) with the Astryx equivalent, preserving the Paraglide locale set/get behavior and `m.*` labels.

- [ ] **Step 4: Sweep `__root.tsx`**

Ensure no remaining `@/components/ui` imports beyond what Task 6 handled; migrate any leftover (e.g. error boundary UI) to Astryx.

- [ ] **Step 5: Verify**

`bun --cwd=apps/web exec tsc --noEmit` → no errors in these files. Run `bun --cwd=apps/web run dev`, log in, confirm the shell renders, nav works, `⌘K` opens the palette, theme toggles.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_app.tsx apps/web/src/routes/_auth.tsx apps/web/src/routes/__root.tsx apps/web/src/components/locale-switcher.tsx
git commit -m "feat(web): app/auth shells + locale switcher on Astryx

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Products feature + products route

**Files:**
- Modify: `apps/web/src/features/products/columns.tsx`
- Modify: `apps/web/src/features/products/form.tsx`
- Modify: `apps/web/src/features/products/row-actions.tsx`
- Modify: `apps/web/src/routes/_app/products.tsx`

**Interfaces:**
- Consumes: `DataTable` (Task 4), form wrappers (Task 3), `toast` (Task 6).
- Preserve: TanStack DB writes (`collection.insert/update/delete` + `await tx.isPersisted.promise`), the products `useLiveQuery`, search param wiring (`?q=`, `?new=`), and all `m.*` strings.

- [ ] **Step 1: Read all four files** to catalog every `@/components/ui` and `lucide-react` import.

- [ ] **Step 2: Rewrite `columns.tsx`** — Astryx `Badge`/`Checkbox Input` (row select) and the sortable header from Task 4; keep `ColumnDef` shapes and cell value logic.

- [ ] **Step 3: Rewrite `form.tsx`** — use the Task 3 field wrappers (no raw inputs), Astryx `Dialog` if it's a modal form, Astryx `Button` for submit/cancel. Preserve TanStack Form setup, TypeBox validation, the insert/update + `tx.isPersisted.promise` flow, and toast on success/error.

- [ ] **Step 4: Rewrite `row-actions.tsx`** — Astryx `Dropdown Menu`/`More Menu` (replace lucide ellipsis icon with Astryx), Astryx `Dialog` for delete confirm (replaces `alert-dialog`). Preserve `collection.delete(id)` + toast.

- [ ] **Step 5: Rewrite `products.tsx` route** — Astryx `Button` for "New product", page heading via Astryx `Heading`; keep `<DataTable>` usage, search-param sync, and the new-product dialog trigger.

- [ ] **Step 6: Verify** — `bun --cwd=apps/web exec tsc --noEmit` (no errors in these files). Run dev: products list renders, sort/search/virtualize work, create + edit + delete a product (toast fires, audit unaffected).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/products apps/web/src/routes/_app/products.tsx
git commit -m "feat(web): products feature + route on Astryx

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Remaining authenticated screens (users, audit-log, profile, dashboard)

**Files:**
- Modify: `apps/web/src/routes/_app/users.tsx`
- Modify: `apps/web/src/routes/_app/audit-log.tsx`
- Modify: `apps/web/src/routes/_app/profile.tsx`
- Modify: `apps/web/src/routes/_app/index.tsx` (dashboard — keeps recharts)
- Modify: `apps/web/src/components/ui/chart.tsx` → relocate/restyle (see Step 4)

**Interfaces:**
- Consumes: `DataTable`, form wrappers, `toast`.
- Preserve: each screen's `useLiveQuery`/data wiring, admin gating, `m.*` strings, and the recharts charts on the dashboard.

- [ ] **Step 1: Read all four route files** + `components/ui/chart.tsx`.

- [ ] **Step 2: Rewrite `users.tsx` + `audit-log.tsx`** — reuse `DataTable`; Astryx `Badge`/`Button`/`Dialog` as needed (e.g. the invite-user dialog surfacing the 422 reason — preserve that behavior). Keep toasts.

- [ ] **Step 3: Rewrite `profile.tsx`** — Astryx `Card` + Task 3 field wrappers + `locale-switcher`; preserve the update flow + toast.

- [ ] **Step 4: Handle the chart wrapper** — Astryx has no charts, so keep recharts. Move the chart container/tooltip wrapper out of `components/ui/` to `apps/web/src/components/chart.tsx` (so `components/ui/` can be deleted wholesale in Task 11). Strip its `cva`/shadcn dependencies; restyle its CSS-var theming to Astryx design tokens (map the current `--chart-1..5` to Astryx token values or keep them defined in `styles.css`). Update `index.tsx` imports.

- [ ] **Step 5: Rewrite `index.tsx`** — Astryx `Card`/`Heading`/`Grid` layout around the (kept) recharts charts.

- [ ] **Step 6: Verify** — `bun --cwd=apps/web exec tsc --noEmit` (no errors in these files). Run dev: each screen renders light + dark; dashboard charts render; profile update + user invite work with toasts.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/routes/_app/users.tsx apps/web/src/routes/_app/audit-log.tsx apps/web/src/routes/_app/profile.tsx apps/web/src/routes/_app/index.tsx apps/web/src/components/chart.tsx
git commit -m "feat(web): users/audit-log/profile/dashboard on Astryx (charts kept on recharts)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Auth screens

**Files:**
- Modify: `apps/web/src/routes/_auth/login.tsx`
- Modify: `apps/web/src/routes/_auth/forgot-password.tsx`
- Modify: `apps/web/src/routes/_auth/reset-password.tsx`

**Interfaces:**
- Consumes: form wrappers (Task 3 — `TextField` with `autoComplete`), `toast` (Task 6).
- Preserve: `authClient` calls (sign-in, forgot/reset password), redirect handling, validators, and `m.*` strings.

- [ ] **Step 1: Read all three files.**

- [ ] **Step 2: Rewrite each** — Astryx `Card` form container, `TextField` wrappers (`autoComplete="email"|"current-password"|"new-password"` preserved), Astryx `Button` submit. Keep the `authClient` flows and `toast` on reset-password.

- [ ] **Step 3: Verify** — `bun --cwd=apps/web exec tsc --noEmit` (no errors here). Run dev: login, forgot-password, reset-password flows render and submit.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_auth
git commit -m "feat(web): auth screens on Astryx

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Cleanup, dependency removal, docs/ADR, final gate

**Files:**
- Delete: `apps/web/src/components/ui/` (all 15 files)
- Delete: `apps/web/src/routes/_app/astryx-sandbox.tsx`
- Modify: `apps/web/package.json` (remove dropped deps)
- Modify: `apps/web/src/styles.css` (drop unused Tailwind theme vars superseded by Astryx, if any)
- Create: `docs/decisions/006-astryx-over-shadcn.md`
- Modify: `CLAUDE.md`, `apps/web/CLAUDE.md`

- [ ] **Step 1: Confirm nothing imports the old surface**

```bash
cd apps/web/src
grep -rl "@/components/ui" . ; echo "--- (expect: only files inside components/ui/ itself, which we delete) ---"
grep -rln "cmdk|from \"sonner\"|class-variance-authority|tailwind-merge|\bclsx\b" . | grep -v "components/ui/"
```
Both (excluding `components/ui/`) must be empty. Fix any stragglers before deleting. NOTE: `lucide-react` is intentionally retained (feeds Astryx `<Icon>`) — do NOT grep it out, but every remaining lucide import must be wrapped by `<Icon icon={...}>`, not rendered raw.

- [ ] **Step 2: Delete dead files**

```bash
rm -rf apps/web/src/components/ui
rm apps/web/src/routes/_app/astryx-sandbox.tsx
```

- [ ] **Step 3: Remove dropped deps from `apps/web/package.json`**

```bash
bun --cwd=apps/web remove radix-ui cmdk sonner class-variance-authority clsx tailwind-merge tw-animate-css
```
(Confirm `recharts`, `tailwindcss`, `lucide-react` (glyph source for Astryx `<Icon>`), all `@tanstack/*`, `better-auth`, paraglide remain.)

- [ ] **Step 4: Write ADR `docs/decisions/006-astryx-over-shadcn.md`**

Match the format of `001`–`005`. Cover: context (adopting Meta Astryx), decision (full migration, theme-neutral, big-bang), consequences (Beta-risk acknowledged, reversibility via this branch/ADR, charts stay on recharts, StyleX ships pre-compiled so no build plugin), and **explicitly note it supersedes the shadcn guidance** in `CLAUDE.md` / `apps/web/CLAUDE.md`.

- [ ] **Step 5: Update `CLAUDE.md` + `apps/web/CLAUDE.md`**

In root `CLAUDE.md`, no shadcn rule exists to change (it's in the web file) — add an Astryx note if appropriate. In `apps/web/CLAUDE.md` "UI" section, replace:
> "shadcn/ui components: add with `bunx shadcn@latest add <name>`; never hand-write files in `src/components/ui/`."

with the Astryx workflow:
> "Astryx components (`@astryxdesign/core`): look up props/usage with `bun --cwd=apps/web run astryx -- component <Name>`; never guess the API. Charts use recharts (Astryx has no charts)."

Keep the forms/tables/i18n rules; update the forms note if `field-errors` folded into the wrappers.

- [ ] **Step 6: FINAL GATE — full check**

```bash
bun run check
```
Expected: green (biome + typecheck, all workspaces). Fix any errors.

- [ ] **Step 7: FINAL GATE — manual app run**

```bash
bun --cwd=apps/web run dev   # (and `bun dev` for the server if needed)
```
Walk every screen in **light and dark**: dashboard (charts render), products (list sorts/searches/virtualizes; create/edit/delete fires toasts), users (invite, 422 reason shown), audit-log, profile (update + locale switch), login/forgot/reset. Open `⌘K` palette and navigate. Confirm a product create writes an audit row (check the audit-log screen).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(web): remove shadcn/Radix/cmdk/sonner/lucide; ADR 006; docs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Build/deps + CSS + `astryx init` → Task 1. ✓
- Verification spike (Vite 7 render, Table+Virtual, dark-mode mechanism) → Task 1. ✓
- Remove radix/cmdk/sonner/cva/clsx/tailwind-merge/tw-animate-css/lucide → Task 11 (tw-animate import dropped in Task 1). ✓
- Icons render through Astryx `<Icon>`; lucide retained as glyph source (REVISED — Astryx has only ~25 semantic names) → handled per-file in each rewrite task. ✓
- Component mapping (button/badge/card/checkbox/dialog/alert-dialog/dropdown/select/input/textarea/label/command/table/sonner) → Tasks 2–10 at point of use; `components/ui/` deleted Task 11. ✓
- Keep recharts; restyle chart wrapper → Task 9 Step 4. ✓
- DataTable keeps TanStack Table/Virtual/Pacer → Task 4. ✓
- Form wrappers keep TanStack Form + TypeBox; interfaces unchanged → Task 3. ✓
- Command palette logic preserved → Task 5. ✓
- Shell → App Shell/Side Nav/Top Nav → Task 7. ✓
- Theme + dark mode native → Task 2. ✓
- All screens rewritten → Tasks 7–10. ✓
- Invariants (i18n `m.*`, audit untouched, Eden treaty) → Global Constraints + verified Task 11. ✓
- ADR 006 + CLAUDE.md updates → Task 11. ✓
- Final gate `bun run check` + manual run → Task 11. ✓

**Placeholder scan:** No "TBD/implement later". Astryx JSX is intentionally described-not-fabricated per the Global Constraint (Beta API discovered via CLI at execution time) — this is a deliberate, documented choice, not a placeholder. Current code to replace is shown verbatim where it matters.

**Type consistency:** Wrapper prop interfaces (`TextField`/`NumberField`/`TextareaField`/`SelectField`/`FieldErrors`) and `DataTable` props are preserved exactly as the current code, so consumer tasks (8–10) compile against unchanged signatures. `useTheme()`/`ThemeProvider` signatures unchanged. `toast` API normalized via shim in Task 6 before consumers use it.
