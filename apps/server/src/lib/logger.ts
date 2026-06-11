import { formatters, serializers } from "@bogeychan/elysia-logger";
import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  // formatters/serializers from elysia-logger collapse the request context
  // that wrap()'s auto-logging emits into { request, responseTime } instead
  // of dumping the entire Elysia context object.
  formatters,
  serializers,
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
});
