import { registerOTel, OTLPHttpJsonTraceExporter } from "@vercel/otel";
// Add otel logging
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR); // set diaglog level to DEBUG when debugging
export function register() {
  registerOTel({
    serviceName: "email_assistant_backend",
    traceExporter: new OTLPHttpJsonTraceExporter({
      url: "https://ingest.in.signoz.cloud:443/v1/traces",
      headers: {
        "signoz-ingestion-key": "4409af11-c954-48a1-a67e-b1e8ef23ce03",
      },
    }),
  });
}
