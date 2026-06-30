# ADR 006: Astryx over shadcn/ui

## Status

Accepted — supersedes the shadcn/ui guidance in `CLAUDE.md` and `apps/web/CLAUDE.md`.

## Context

The project launched with shadcn/ui (Radix primitives + Tailwind + class-variance-authority) as its component surface. Decided 2026-06-30.

Meta's Astryx design system (`@astryxdesign/core` v0.1.2) became available as a beta offering with 148 production-quality components, a neutral theme (`@astryxdesign/theme-neutral`), built-in dark-mode via `data-theme` attribute, StyleX-backed styling compiled to standard CSS (no build plugin required), and a CLI for safe discovery of its beta API. The design system provides AppShell, SideNav, TopNav, Table, Form fields with built-in validation display, Dialogs, Banners, and more — covering every UI need of this admin-kit boilerplate.

Continuing with shadcn/ui would require maintaining a parallel token system, custom dark-mode implementation, and hand-rolled component patterns that Astryx provides natively.

## Decision

Full big-bang migration of `apps/web` to Astryx:

- **Component library**: `@astryxdesign/core` replaces all of `components/ui/` (all 15 shadcn-generated files deleted).
- **Theme**: `@astryxdesign/theme-neutral` provides the design token surface. Dark mode toggles via `data-theme="dark"` on the root element — no Tailwind `dark:` variant needed.
- **Styling**: Tailwind utility classes backed by Astryx tokens (`bg-surface`, `text-primary`, etc.) via `tailwind-theme.css`. Raw shadcn `@theme inline` color mappings and `@custom-variant dark` removed from `styles.css`.
- **Charts**: recharts is retained; Astryx has no charting primitives. Chart colors remain as `--chart-*` CSS custom properties in `styles.css`.
- **Icons**: `lucide-react` is retained purely as a glyph source for Astryx `<Icon icon={Comp}>` — lucide components are never rendered directly.
- **StyleX**: Astryx ships pre-compiled CSS; no StyleX build plugin is required in the Vite config.
- **API discovery**: Because Astryx is in beta, all component APIs are discovered via `bunx astryx component <Name>` — never guessed from training data.

## Consequences

- **Beta risk acknowledged**: Astryx v0.1.2 is a beta release. API churn is possible on minor version bumps; `bunx astryx upgrade --apply` should be run after any `@astryxdesign/core` version bump. The migration is reversible via this git branch and this ADR.
- **Dropped dependencies**: `radix-ui`, `cmdk`, `sonner`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` removed from `apps/web/package.json`.
- **`lib/utils.ts` deleted**: The `cn()` helper (clsx + tailwind-merge) was only consumed by `components/ui/` — removed along with the ui directory.
- **Form errors**: The `FieldErrors` React component is removed; form wrappers render errors internally via Astryx Field `status` prop. The `message()` and `fieldErrorText()` utility functions in `field-errors.tsx` are retained as they are used by the wrappers.
- **shadcn/ui guidance removed** from `apps/web/CLAUDE.md` UI section; replaced with Astryx workflow.
