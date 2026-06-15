# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the seven audit-verified cleanups (A–G) from the cleanup spec — all behaviour-preserving.

**Architecture:** Surgical edits only. No new behaviour, no new Paraglide keys, no test infra (none, by design). Each task is one self-contained, independently-committable change verified by `bun run check` (biome + typecheck across all workspaces).

**Tech Stack:** Bun workspaces, ElysiaJS, React 19 + TanStack Form/Router, TypeBox, drizzle, @react-email/components.

**Verification rule (every task):** `bun run check` must pass before commit. There are no automated tests in this repo by design — `bun run check` is the gate, plus a final manual app run.

---

### Task 1: F — delete dead `AuditAction` re-export

**Files:**
- Modify: `apps/server/src/audit/service.ts:6`

- [ ] **Step 1: Remove the re-export line**

Delete line 6 entirely:

```ts
export type { AuditAction };
```

Keep line 4 (`import type { AuditAction } from "./audit";`) — it is used internally by the `AuditQuery` interface.

- [ ] **Step 2: Verify**

Run: `bun run check`
Expected: PASS (no consumer imports `AuditAction` from `./service`; the type still lives in `audit/audit.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/audit/service.ts
git commit -m "refactor(server): drop unused AuditAction re-export"
```

---

### Task 2: G — align products heading weight

**Files:**
- Modify: `apps/web/src/routes/_app/products.tsx:57`

- [ ] **Step 1: Change the heading weight**

Replace:

```tsx
className="font-semibold text-2xl"
```

with:

```tsx
className="font-bold text-2xl"
```

(matches `users.tsx`, `audit-log.tsx`, `profile.tsx`, `index.tsx`).

- [ ] **Step 2: Verify**

Run: `bun run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_app/products.tsx
git commit -m "style(web): products heading uses font-bold like other pages"
```

---

### Task 3: B — shared email layout

**Files:**
- Create: `apps/server/src/email/templates/layout.tsx`
- Modify: `apps/server/src/email/templates/invite.tsx`
- Modify: `apps/server/src/email/templates/reset-password.tsx`

- [ ] **Step 1: Create the shared layout**

`apps/server/src/email/templates/layout.tsx`:

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({
  preview,
  heading,
  children,
  buttonUrl,
  buttonLabel,
  footer,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
  buttonUrl: string;
  buttonLabel: string;
  footer: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 8,
            margin: "40px auto",
            maxWidth: 480,
            padding: 32,
          }}
        >
          <Heading as="h2">{heading}</Heading>
          {children}
          <Button
            href={buttonUrl}
            style={{
              backgroundColor: "#171717",
              borderRadius: 6,
              color: "#ffffff",
              padding: "12px 20px",
            }}
          >
            {buttonLabel}
          </Button>
          <Text style={{ color: "#737373", fontSize: 13 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Rewrite `invite.tsx` to use the layout**

Replace the entire file `apps/server/src/email/templates/invite.tsx`:

```tsx
import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function InviteEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout
      preview="You're invited to admin-kit"
      heading="You're invited"
      buttonUrl={url}
      buttonLabel="Set your password"
      footer="If you weren't expecting this, contact your administrator."
    >
      <Text>Hi {name},</Text>
      <Text>
        An account has been created for you on admin-kit. Set your password to
        get started. The link expires in 1 hour.
      </Text>
    </EmailLayout>
  );
}
```

- [ ] **Step 3: Rewrite `reset-password.tsx` to use the layout**

Replace the entire file `apps/server/src/email/templates/reset-password.tsx`:

```tsx
import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function ResetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout
      preview="Reset your admin-kit password"
      heading="Reset your password"
      buttonUrl={url}
      buttonLabel="Reset password"
      footer="If you didn't request this, you can safely ignore this email."
    >
      <Text>Hi {name},</Text>
      <Text>
        Someone requested a password reset for your admin-kit account. The link
        expires in 1 hour.
      </Text>
    </EmailLayout>
  );
}
```

- [ ] **Step 4: Verify**

Run: `bun run check`
Expected: PASS. The exported function names (`InviteEmail`, `ResetPasswordEmail`) and their `{ name, url }` props are unchanged, so `email/send.ts` callers still typecheck.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/email/templates/
git commit -m "refactor(server): extract shared EmailLayout for email templates"
```

---

### Task 4: A — auth forms use the `TextField` wrapper

**Files:**
- Modify: `apps/web/src/components/form/text-field.tsx`
- Modify: `apps/web/src/routes/_auth/login.tsx`
- Modify: `apps/web/src/routes/_auth/forgot-password.tsx`
- Modify: `apps/web/src/routes/_auth/reset-password.tsx`

- [ ] **Step 1: Add optional `autoComplete` to `TextField`**

Replace `apps/web/src/components/form/text-field.tsx`:

```tsx
import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldErrors } from "./field-errors";

interface TextFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function TextField({
  field,
  label,
  type = "text",
  placeholder,
  autoComplete,
}: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={(field.state.value as string | null | undefined) ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FieldErrors field={field} />
    </div>
  );
}
```

- [ ] **Step 2: Migrate `login.tsx`**

In `apps/web/src/routes/_auth/login.tsx`, change the imports — remove the `Input` and `Label` imports, add the `TextField` import:

```tsx
import { TextField } from "@/components/form/text-field";
```

(Resulting import block keeps: `useForm`, `createFileRoute/Link/useRouter`, `useState`, `Button`, `Card*`, `TextField`, `authClient`, `m`. `Input` and `Label` must be gone.)

Replace the email `form.Field` render child:

```tsx
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                value.includes("@") ? undefined : m.common_email_invalid(),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label={m.common_email()}
                type="email"
                autoComplete="email"
              />
            )}
          </form.Field>
```

Replace the password `form.Field` render child:

```tsx
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length >= 8 ? undefined : m.common_password_min(),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label={m.auth_password()}
                type="password"
                autoComplete="current-password"
              />
            )}
          </form.Field>
```

- [ ] **Step 3: Migrate `forgot-password.tsx`**

In `apps/web/src/routes/_auth/forgot-password.tsx`, remove `Input` and `Label` imports, add `import { TextField } from "@/components/form/text-field";`.

Replace the email `form.Field` render child:

```tsx
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  value.includes("@") ? undefined : m.common_email_invalid(),
              }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label={m.common_email()}
                  type="email"
                  autoComplete="email"
                />
              )}
            </form.Field>
```

- [ ] **Step 4: Migrate `reset-password.tsx`**

In `apps/web/src/routes/_auth/reset-password.tsx`, remove `Input` and `Label` imports, add `import { TextField } from "@/components/form/text-field";`.

Replace the `newPassword` `form.Field` render child:

```tsx
          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) =>
                value.length >= 8 ? undefined : m.common_password_min(),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label={m.auth_new_password()}
                type="password"
                autoComplete="new-password"
              />
            )}
          </form.Field>
```

Replace the `confirm` `form.Field` render child (keep its `validators` block exactly — only the render child changes):

```tsx
          <form.Field
            name="confirm"
            validators={{
              onChangeListenTo: ["newPassword"],
              onChange: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue("newPassword")
                  ? undefined
                  : m.common_passwords_no_match(),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label={m.auth_confirm_password()}
                type="password"
                autoComplete="new-password"
              />
            )}
          </form.Field>
```

- [ ] **Step 5: Verify**

Run: `bun run check`
Expected: PASS. (Biome will fail on any leftover unused `Input`/`Label` import — remove them if so.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/form/text-field.tsx apps/web/src/routes/_auth/
git commit -m "refactor(web): auth forms use TextField wrapper (no hand-rolled fields)"
```

---

### Task 5: E — move the invite body schema into `@admin-kit/shared`

**Files:**
- Create: `packages/shared/src/schemas/users.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `apps/server/src/modules/users/routes.ts`

- [ ] **Step 1: Create the shared schema**

`packages/shared/src/schemas/users.ts`:

```ts
import { Type } from "@sinclair/typebox";

// Role union must stay aligned with the Better Auth runtime config
// (defaultRole: "member", adminRoles: ["admin"]) in apps/server/src/auth/auth.ts.
export const UserInviteSchema = Type.Object({
  email: Type.String({ format: "email" }),
  name: Type.String({ minLength: 1 }),
  role: Type.Union([Type.Literal("admin"), Type.Literal("member")]),
});

export type UserInvite = typeof UserInviteSchema.static;
```

- [ ] **Step 2: Re-export from the schemas index**

`packages/shared/src/schemas/index.ts` — add the line:

```ts
export * from "./products";
export * from "./users";
```

- [ ] **Step 3: Use the shared schema in the route**

In `apps/server/src/modules/users/routes.ts`:
- Add `UserInviteSchema` to the `@admin-kit/shared` import.
- Change `import { Elysia, t } from "elysia";` to `import { Elysia } from "elysia";` (the inline `t.Object(...)` is the only `t` usage; it goes away).
- Replace the `body:` option:

```ts
    {
      role: "admin",
      body: UserInviteSchema,
    },
```

Top-of-file import additions:

```ts
import { UserInviteSchema } from "@admin-kit/shared";
```

- [ ] **Step 4: Verify**

Run: `bun run check`
Expected: PASS. Eden's inferred body type for `/users/invite` is unchanged (same shape), so the frontend `api.users.invite.post(value)` call still typechecks.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/ apps/server/src/modules/users/routes.ts
git commit -m "refactor(shared): move user invite body schema to @admin-kit/shared"
```

---

### Task 6: C — extract a `service.ts` for the users module

**Files:**
- Create: `apps/server/src/modules/users/service.ts`
- Modify: `apps/server/src/modules/users/routes.ts`

- [ ] **Step 1: Create the service**

`apps/server/src/modules/users/service.ts`:

```ts
import type { UserInvite } from "@admin-kit/shared";
import { APIError } from "better-auth/api";
import { auth } from "../../auth/auth";
import { markInvited } from "../../email/invites";
import { env } from "../../lib/env";

type InviteResult =
  | { ok: true; id: string }
  | { ok: false; status: 409 | 502; message: string };

export async function inviteUser(
  headers: Headers,
  body: UserInvite,
): Promise<InviteResult> {
  let created: Awaited<ReturnType<typeof auth.api.createUser>>;
  try {
    created = await auth.api.createUser({
      body: {
        email: body.email,
        name: body.name,
        // throwaway — the invitee sets their real password via the emailed link
        password: crypto.randomUUID(),
        // cast: InferAdminRolesFromOption defaults to "user"|"admin" but
        // our runtime config uses "member"|"admin" via defaultRole/adminRoles
        role: body.role as "user" | "admin",
      },
      headers,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { ok: false, status: 409, message: error.message };
    }
    throw error;
  }
  markInvited(body.email);
  try {
    await auth.api.requestPasswordReset({
      body: {
        email: body.email,
        redirectTo: `${env.WEB_ORIGIN}/reset-password`,
      },
    });
  } catch {
    // User exists but the invite email failed. The invite marker stays
    // set, so a later forgot-password for this email re-sends the invite.
    return {
      ok: false,
      status: 502,
      message:
        "User created but the invite email failed to send. Use forgot password to resend it.",
    };
  }
  return { ok: true, id: created.user.id };
}
```

- [ ] **Step 2: Reduce the route to a thin handler**

Replace the whole `apps/server/src/modules/users/routes.ts`:

```ts
import { UserInviteSchema } from "@admin-kit/shared";
import { Elysia } from "elysia";
import { betterAuthPlugin } from "../../auth/plugin";
import { inviteUser } from "./service";

export const usersModule = new Elysia({ prefix: "/users" })
  .use(betterAuthPlugin)
  .post(
    "/invite",
    async ({ body, status, request: { headers } }) => {
      const result = await inviteUser(headers, body);
      if (!result.ok) return status(result.status, { message: result.message });
      return { id: result.id };
    },
    {
      role: "admin",
      body: UserInviteSchema,
    },
  );
```

- [ ] **Step 3: Verify**

Run: `bun run check`
Expected: PASS. The route still returns `{ id }` on success and `status(409|502, { message })` on failure — identical wire behaviour and Eden-inferred response types.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/modules/users/
git commit -m "refactor(server): extract users inviteUser service from route handler"
```

---

### Task 7: D — shared error-envelope decoder for the invite dialog

**Files:**
- Create: `apps/web/src/lib/mutation-error.ts`
- Modify: `apps/web/src/features/products/collection.ts`
- Modify: `apps/web/src/routes/_app/users.tsx`

- [ ] **Step 1: Create the shared decoder**

`apps/web/src/lib/mutation-error.ts`:

```ts
// Decodes an Eden/Elysia error-envelope value to a human-readable string.
// Order matches Elysia's shapes: 422 carries `summary`; route-level errors carry
// `message`; some errors are a bare string. Returns undefined when nothing usable
// is present so callers supply their own Paraglide fallback message.
export function decodeErrorMessage(value: unknown): string | undefined {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.summary === "string") return record.summary;
    if (typeof record.message === "string") return record.message;
    return undefined;
  }
  return typeof value === "string" ? value : undefined;
}
```

- [ ] **Step 2: Make `toMutationError` reuse the decoder**

In `apps/web/src/features/products/collection.ts`, add the import near the top (with the other `@/lib` imports):

```ts
import { decodeErrorMessage } from "@/lib/mutation-error";
```

Replace the `toMutationError` function body:

```ts
function toMutationError(error: {
  status: number;
  value: unknown;
}): ProductMutationError {
  const message =
    decodeErrorMessage(error.value) ?? `Request failed (${error.status})`;
  const record =
    error.value && typeof error.value === "object"
      ? (error.value as Record<string, unknown>)
      : undefined;
  // Elysia validation errors carry the failing path, e.g. "/name"
  const property =
    record && typeof record.property === "string"
      ? record.property.replace(/^\//, "")
      : undefined;
  return new ProductMutationError(error.status, message, property);
}
```

- [ ] **Step 3: Use the decoder in the invite dialog**

In `apps/web/src/routes/_app/users.tsx`, add the import:

```ts
import { decodeErrorMessage } from "@/lib/mutation-error";
```

Replace the invite-failure block in `InviteDialog`'s `onSubmit` (currently lines ~185-194):

```ts
      const { data, error } = await api.users.invite.post(value);
      if (error) {
        toast.error(decodeErrorMessage(error.value) ?? m.users_invite_error());
        return;
      }
```

(Keep the success path — `toast.success(...)`, `form.reset()`, `setOpen(false)`, `onInvited()`, `return data` — unchanged.)

- [ ] **Step 4: Verify**

Run: `bun run check`
Expected: PASS. Products behaviour is unchanged (decoder returns the same `summary → message` order; `Request failed (status)` fallback preserved; property extraction preserved). Invite 409/502 (`{message}`) unchanged; a 422 now surfaces `summary` instead of the generic fallback.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mutation-error.ts apps/web/src/features/products/collection.ts apps/web/src/routes/_app/users.tsx
git commit -m "refactor(web): shared error-envelope decoder; invite dialog surfaces 422 reason"
```

---

## Final verification (after all tasks)

- [ ] `bun run check` passes clean.
- [ ] `docker compose up -d` then `bun dev`; smoke-test:
  - Login, forgot-password, reset-password forms render, validate, and submit (Task 4).
  - Invite a user (admin): happy path shows success toast; duplicate email shows the 409 message; both emails render in Mailpit (Tasks 3, 5, 6, 7).
  - Products page heading renders bold; audit log page renders (Tasks 2, 1).
- [ ] No new Paraglide keys were added (grep confirms no new `m.*` calls).

## Out of scope (noted, not done)

- The invite dialog in `users.tsx` also hand-rolls `Label`/`Input` fields (same pattern as Task 4's auth forms). Approved scope for finding A was the three `_auth/*` forms only. Migrating the invite dialog to `TextField` is a clean follow-up but is intentionally excluded here.
