import { Injectable } from "@nestjs/common";
import {
  ExecutionMetricStatus,
  ExecutionMetrics,
} from "../../execution/application/ports/execution-metrics.port";
import { observeExecutionDurationMetric } from "./metrics.registry";

@Injectable()
export class PrometheusExecutionMetrics implements ExecutionMetrics {
  observeDuration(
    status: ExecutionMetricStatus,
    durationSeconds: number,
  ): void {
    observeExecutionDurationMetric(status, durationSeconds);
  }
}
