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
