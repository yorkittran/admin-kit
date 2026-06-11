import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { env } from "./env";

// No OTLP endpoint configured → instrument with zero exporters (effectively off).
const spanProcessors = env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        }),
      ),
    ]
  : [];

export const otel = opentelemetry({
  serviceName: "admin-kit-server",
  spanProcessors,
});
