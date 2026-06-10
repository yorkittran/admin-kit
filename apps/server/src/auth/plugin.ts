import { Elysia } from "elysia";
import { auth } from "./auth";

// Mounts Better Auth at /api/auth/* and exposes route guards:
//   { auth: true }      → 401 without a session
//   { role: "admin" }   → 401 without a session, 403 without the role
export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return { user: session.user, session: session.session };
      },
    },
    role: (required: "admin" | "member") => ({
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        if (required === "admin" && session.user.role !== "admin") {
          return status(403);
        }
        return { user: session.user, session: session.session };
      },
    }),
  });
