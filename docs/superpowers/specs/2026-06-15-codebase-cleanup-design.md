# Codebase cleanup — design

Date: 2026-06-15

## Context

A multi-agent audit (6 dimensions: dead-code, duplication, structure, comments,
types, consistency; each finding adversarially verified) confirmed the codebase
is already clean: zero correctness/security/behavior defects, and inline comments
are high-value "why" notes that stay untouched. This spec covers the seven small,
surgical cleanups the audit surfaced. Every change is behaviour-preserving.

Out of scope: comment removal (the audit found near-zero redundant comments),
structural rewrites, adding tests (none, by design), generated/vendored files.

## Findings to apply (all approved)

### A. Auth forms use the `TextField` wrapper instead of hand-rolled fields
`_auth/login.tsx`, `_auth/forgot-password.tsx`, `_auth/reset-password.tsx` each
hand-roll `<div><Label/><Input/>{error}</div>` blocks (six total). This both
duplicates markup and breaks the hard rule "never hand-roll fields — use the
wrappers in `components/form/`".

- The only gap: the hand-rolled inputs set `autoComplete` (`email`,
  `current-password`, `new-password`); `TextField` has no such prop.
- Change: add optional `autoComplete?: string` to `TextField` (pass through to
  `Input`). Migrate all six blocks to `<TextField field={field} label=… type=…
  autoComplete=… />`.
- Error rendering is equivalent: auth forms use inline string validators, and
  `FieldErrors` renders the same `errors.join(", ")` for string errors.

### B. Shared layout for the two email templates
`email/templates/invite.tsx` and `reset-password.tsx` duplicate the entire
`Html/Head/Preview/Body/Container/Heading/Button` shell and its inline style
objects; only the preview text, heading, body copy, and button label differ.

- Change: extract a shared `EmailLayout` (and the styled CTA button) into
  `email/templates/layout.tsx`; each template renders the layout with its own
  text. Server-side only; not Paraglide-governed (emails are hardcoded English).

### C. Extract a `service.ts` for the users module
`modules/users/routes.ts` inlines invite orchestration (`createUser` +
`markInvited` + `requestPasswordReset` + 409/502 mapping) in the route handler.
Every other resource module follows `routes.ts` (routing/validation/auth) +
`service.ts` (logic). Users is the lone exception.

- Change: add `modules/users/service.ts` exporting `inviteUser(headers, { email,
  name, role })` that performs the orchestration and returns a discriminated
  result; the route maps that result to status codes. The `headers` dependency
  (needed by `createUser`) is passed through. This route legitimately does not
  call `audit()` (user creation is owned by Better Auth) — unchanged.

### D. Invite dialog surfaces the full error envelope
`_app/users.tsx` invite failure reads only `error.value.message`, so a 422
carrying `summary`/`property` falls back to the generic toast.

- Change: extract the value-decoding part of products' `toMutationError`
  (`features/products/collection.ts`) into a small shared helper in `src/lib`
  and call it on invite failure. Keep `m.users_invite_error()` as the Paraglide
  fallback — do NOT reuse `toMutationError` verbatim (its non-Paraglide fallback
  strings would break the i18n hard rule). 409/502 (`{message}`) behaviour
  unchanged; 422 now shows the real reason.

### E. Move the invite body schema into `@admin-kit/shared`
`modules/users/routes.ts:53-58` declares the invite body (`email`/`name`/`role`)
inline; the server convention is that domain schemas live in `@admin-kit/shared`.

- Change: add `UserInviteSchema` to `packages/shared/src/schemas`, re-export via
  the schemas index, import it in `routes.ts`. Copy the role union
  (`t.Union([Literal("admin"), Literal("member")])`) exactly — it must stay
  aligned with the Better Auth runtime config (`defaultRole: "member"`,
  `adminRoles: ["admin"]`). Hand-written TypeBox (no backing Drizzle table).

### F. Delete dead re-export
`audit/service.ts:6` re-exports `export type { AuditAction }`; nothing imports it
(routes pulls only the list fns, the frontend declares its own local type, the
server's public surface is `App`). The type still lives in `audit/audit.ts`.

- Change: delete the line. The internal `import type` on line 4 stays.

### G. Align products heading weight
`_app/products.tsx:57` uses `font-semibold text-2xl`; the other four pages use
`font-bold text-2xl`.

- Change: `font-semibold` → `font-bold`.

## Verification

- `bun run check` (biome + typecheck all workspaces) passes after each change.
- Run the app and exercise: login / forgot-password / reset-password forms render
  and validate (A); both emails render in Mailpit (B); user invite happy path +
  duplicate (409) + a validation failure surfacing the real message (C, D, E);
  audit log + products page render (F, G).
- No new Paraglide keys required (no new user-facing strings).

## Risks

All changes are behaviour-preserving relocations/substitutions. Highest-touch is
A (three route files + one wrapper) and C (new service file). E couples a shared
schema to the Better Auth role config — kept literally identical to avoid drift.
