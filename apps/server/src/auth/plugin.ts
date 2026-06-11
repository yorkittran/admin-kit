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
  // Scoped .all instead of root .mount(auth.handler): an un-pathed mount
  // matches /* and swallows every unmatched route with an empty-body 404,
  // bypassing the app-level NOT_FOUND error envelope. parse: "none" hands
  // Better Auth the raw request (same as mount does internally) — otherwise
  // Elysia consumes the body first and auth.handler throws BODY_ALREADY_USED.
  .all(
    "/api/auth/*",
    ({ request, status, set }) => {
      if (
        request.method === "GET" ||
        request.method === "HEAD" ||
        request.method === "POST"
      ) {
        return auth.handler(request);
      }
      set.headers.allow = "GET, HEAD, POST";
      return status(405);
    },
    { parse: "none" },
  )
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
