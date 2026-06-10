import { Elysia } from "elysia";
import { auth } from "./auth";

async function getSessionContext(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return { user: session.user, session: session.session };
}

// Mounts Better Auth at /api/auth/* and exposes route guards:
//   { auth: true }      → 401 without a session
//   { role: "admin" }   → 401 without a session, 403 without the role
//   { role: "member" }  → same as { auth: true }; future roles gate here
export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const ctx = await getSessionContext(headers);
        if (!ctx) return status(401);
        return ctx;
      },
    },
    role: (required: "admin" | "member") => ({
      async resolve({ status, request: { headers } }) {
        const ctx = await getSessionContext(headers);
        if (!ctx) return status(401);
        if (required === "admin" && ctx.user.role !== "admin") {
          return status(403);
        }
        return ctx;
      },
    }),
  });
