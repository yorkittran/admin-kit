import { opentelemetry } from "@elysiajs/opentelemetry";
// keep @opentelemetry/* pinned in lockstep with @elysiajs/opentelemetry's bundled sdk-node
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Elysia } from "elysia";
import { env } from "./env";

// OTEL_EXPORTER_OTLP_ENDPOINT set → full instrumentation with an OTLP exporter.
// The exporter reads OTEL_EXPORTER_OTLP_ENDPOINT itself (and appends /v1/traces
// with correct slash handling), so we only use our env var as the on/off gate.
// Unset → plain no-op plugin under the same name: no per-request tracing work.
export const otel = env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? opentelemetry({
      serviceName: "admin-kit-server",
      spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
      // health probes are high-frequency noise; don't trace them
      checkIfShouldTrace: (req) => new URL(req.url).pathname !== "/health",
    })
  : new Elysia({ name: "@elysia/opentelemetry" });
