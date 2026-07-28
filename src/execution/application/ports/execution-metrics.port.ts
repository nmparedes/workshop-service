export type ExecutionMetricStatus = "diagnosis" | "repair" | "finished";

export interface ExecutionMetrics {
  observeDuration(status: ExecutionMetricStatus, durationSeconds: number): void;
}

export const EXECUTION_METRICS = Symbol("EXECUTION_METRICS");
