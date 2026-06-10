import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { betterAuthPlugin } from "./auth/plugin";
import { startJobs } from "./jobs";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

await startJobs();

const app = new Elysia()
  .use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  .use(openapi())
  .use(betterAuthPlugin)
  .get("/health", () => ({ status: "ok" as const }))
  .listen(env.PORT);

logger.info(
  `API on :${env.PORT} — docs at http://localhost:${env.PORT}/openapi`,
);

export type App = typeof app;
