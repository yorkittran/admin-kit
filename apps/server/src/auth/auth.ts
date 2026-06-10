import { accounts, sessions, users, verifications } from "@admin-kit/shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "../db/client";
import { consumeInvited } from "../email/invites";
import { queueEmail } from "../email/send";
import { InviteEmail } from "../email/templates/invite";
import { ResetPasswordEmail } from "../email/templates/reset-password";
import { env } from "../lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),
  emailAndPassword: {
    enabled: true,
    // internal tool — accounts exist by invite only
    disableSignUp: true,
    sendResetPassword: async ({ user, url }) => {
      if (consumeInvited(user.email)) {
        await queueEmail(
          user.email,
          "You're invited to admin-kit",
          InviteEmail({ name: user.name, url }),
        );
      } else {
        await queueEmail(
          user.email,
          "Reset your admin-kit password",
          ResetPasswordEmail({ name: user.name, url }),
        );
      }
    },
  },
  plugins: [admin({ defaultRole: "member", adminRoles: ["admin"] })],
  advanced: {
    database: {
      // keep app-generated ids uuidv7 like the rest of the schema
      generateId: () => Bun.randomUUIDv7(),
    },
  },
});
