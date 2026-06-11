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
import { otel } from "./lib/otel";
import { productsModule } from "./modules/products/routes";
import { usersModule } from "./modules/users/routes";

await startJobs();

const app = new Elysia()
  // cors first so even 429/500 responses carry CORS headers the browser can read
  .use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  // otel early so spans cover the whole middleware chain; exporter is
  // env-gated in lib/otel.ts (no OTEL_EXPORTER_OTLP_ENDPOINT → no exporters).
  .use(otel)
  // ignore error contexts: wrap's own onError would log every non-404 error,
  // duplicating the envelope's single logger.error below and logging 422
  // validation misses at error level. Response (access) logging stays on.
  .use(wrap(logger, { autoLogging: { ignore: (ctx) => ctx.isError } }))
  // CSP off: this server returns JSON plus the Scalar docs page, which needs
  // inline scripts/styles. Re-enable with directives if it ever serves more HTML.
  .use(helmet({ contentSecurityPolicy: false }))
  .use(
    rateLimit({
      duration: 60_000,
      max: 300,
      headers: true,
      // Without this, the plugin's onError REFUNDS the counter for any non-404
      // error — but PARSE/VALIDATION throw before beforeHandle ever increments,
      // so malformed requests would decrement counts they never added (an
      // attacker could interleave bad-JSON posts to undo rate-limit charges).
      // Residual plugin limitation: pre-beforeHandle failures are merely
      // uncounted — they no longer refund anything.
      countFailedRequest: true,
      // Direct TCP peer by default; behind a trusted reverse proxy set
      // TRUST_PROXY=true so clients don't all collapse into the proxy's bucket.
      generator: (request, server) => {
        if (env.TRUST_PROXY) {
          const client = request.headers
            .get("x-forwarded-for")
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .at(-1); // last entry = the one appended by the trusted proxy
          if (client) return client;
        }
        return server?.requestIP(request)?.address ?? "";
      },
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
    // { err: error } — the registered err serializer handles non-Error throws
    // predictably (vs passing the bare value as pino's merge object).
    logger.error({ err: error }, "unhandled error");
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
