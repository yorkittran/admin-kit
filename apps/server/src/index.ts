import { wrap } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { rateLimit } from "elysia-rate-limit";
import { betterAuthPlugin } from "./auth/plugin";
import { startJobs } from "./jobs";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { productsModule } from "./modules/products/routes";
import { usersModule } from "./modules/users/routes";

await startJobs();

const app = new Elysia()
  // cors first so even 429/500 responses carry CORS headers the browser can read
  .use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  .use(wrap(logger))
  // CSP off: this server returns JSON plus the Scalar docs page, which needs
  // inline scripts/styles. Re-enable with directives if it ever serves more HTML.
  .use(helmet({ contentSecurityPolicy: false }))
  .use(
    rateLimit({
      duration: 60_000,
      max: 300,
      headers: true,
      generator: (request, server) => server?.requestIP(request)?.address ?? "",
      skip: (request) => new URL(request.url).pathname === "/health",
    }),
  )
  // onError AFTER rateLimit: error hooks run in registration order and stop at
  // the first returned value. rateLimit counts unmatched routes (NOT_FOUND) in
  // its own onError hook — registering the envelope first would starve it, so
  // 404 floods would never hit the limiter.
  .onError(({ code, error, status }) => {
    // VALIDATION must pass through untouched: the FE maps Elysia's default
    // 422 shape (error.value.property / error.value.message) to form fields.
    if (code === "VALIDATION") return;
    // status(...) instead of set.status + bare return: it carries the HTTP
    // status in the type, so Eden keeps these envelopes out of the 200 union.
    if (code === "NOT_FOUND") {
      return status(404, { code: "NOT_FOUND", message: "Not found" });
    }
    if (code === "PARSE") {
      return status(400, { code: "PARSE", message: "Invalid request body" });
    }
    logger.error(error, "unhandled error");
    return status(500, {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  })
  .use(openapi())
  .use(betterAuthPlugin)
  .use(usersModule)
  .use(productsModule)
  .get("/health", () => ({ status: "ok" as const }))
  .listen(env.PORT);

logger.info(
  `API on :${env.PORT} — docs at http://localhost:${env.PORT}/openapi`,
);

export type App = typeof app;
