import { formatters, isContext, serializers } from "@bogeychan/elysia-logger";
import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  // formatters/serializers from elysia-logger collapse the request context
  // that wrap()'s auto-logging emits into { request, responseTime } instead
  // of dumping the entire Elysia context object.
  // Guarded: the package formatter treats ANY object with method+url keys as a
  // Request and calls object.headers.get(...) — a plain logger.info({ method,
  // url }) would crash. Only delegate for contexts and real Requests.
  formatters: {
    log: (object) =>
      isContext(object) || object instanceof Request
        ? formatters.log(object)
        : object,
  },
  serializers,
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
});
