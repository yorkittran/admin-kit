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
