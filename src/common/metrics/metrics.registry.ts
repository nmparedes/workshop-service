import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

const SERVICE_NAME = "workshop-service";

export const orderExecutionDurationSeconds = new Histogram({
  name: "order_execution_duration_seconds",
  help: "Execution transition durations measured from persisted execution timestamps.",
  labelNames: ["status"],
  buckets: [1, 5, 15, 30, 60, 120, 300, 600, 1800, 3600],
  registers: [metricsRegistry],
});

export const integrationFailuresTotal = new Counter({
  name: "integration_failures_total",
  help: "Total number of confirmed technical integration failures.",
  labelNames: ["service", "integration"],
  registers: [metricsRegistry],
});

export function observeExecutionDurationMetric(
  status: "diagnosis" | "repair" | "finished",
  durationSeconds: number,
): void {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return;
  orderExecutionDurationSeconds.observe({ status }, durationSeconds);
}

export function incrementIntegrationFailureMetric(integration: string): void {
  integrationFailuresTotal.inc({
    service: SERVICE_NAME,
    integration,
  });
}
