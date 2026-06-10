import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

const app = new Elysia()
  .use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  .use(openapi())
  .get("/health", () => ({ status: "ok" as const }))
  .listen(env.PORT);

logger.info(
  `API on :${env.PORT} — docs at http://localhost:${env.PORT}/openapi`,
);

export type App = typeof app;
