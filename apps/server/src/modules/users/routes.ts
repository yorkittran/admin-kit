import { APIError } from "better-auth/api";
import { Elysia, t } from "elysia";
import { auth } from "../../auth/auth";
import { betterAuthPlugin } from "../../auth/plugin";
import { markInvited } from "../../email/invites";
import { env } from "../../lib/env";

export const usersModule = new Elysia({ prefix: "/users" })
  .use(betterAuthPlugin)
  .post(
    "/invite",
    async ({ body, status, request: { headers } }) => {
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
          return status(409, { message: error.message });
        }
        throw error;
      }
      markInvited(body.email);
      await auth.api.requestPasswordReset({
        body: {
          email: body.email,
          redirectTo: `${env.WEB_ORIGIN}/reset-password`,
        },
      });
      return { id: created.user.id };
    },
    {
      role: "admin",
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 1 }),
        role: t.Union([t.Literal("admin"), t.Literal("member")]),
      }),
    },
  );
