import { ExecutionStatus } from "../../src/execution/domain/enums/execution-status.enum";
import { Execution } from "../../src/execution/domain/entities/execution.entity";
import { ExecutionOrmEntity } from "../../src/execution/infrastructure/typeorm/execution.orm-entity";
import { FailExecutionDto } from "../../src/execution/application/dto/fail-execution.dto";

interface ExecutionFactoryOverrides {
  id?: string;
  sagaId?: string;
  orderId?: string;
  requestEventId?: string | null;
  correlationId?: string | null;
  status?: ExecutionStatus;
  failureCode?: string | null;
  failureReason?: string | null;
  queuedAt?: Date;
  diagnosisStartedAt?: Date | null;
  repairStartedAt?: Date | null;
  finishedAt?: Date | null;
  failedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

function withDefault<T>(
  value: T | undefined,
  fallback: Exclude<T, undefined>,
): Exclude<T, undefined> {
  return (value === undefined ? fallback : value) as Exclude<T, undefined>;
}

export function createExecution(
  overrides: ExecutionFactoryOverrides = {},
): Execution {
  return Execution.restore({
    id: overrides.id ?? "execution-001",
    sagaId: overrides.sagaId ?? "saga-001",
    orderId: overrides.orderId ?? "order-001",
    requestEventId: withDefault(overrides.requestEventId, "request-event-001"),
    correlationId: withDefault(overrides.correlationId, "correlation-001"),
    status: overrides.status ?? ExecutionStatus.QUEUED,
    failureCode: overrides.failureCode ?? null,
    failureReason: overrides.failureReason ?? null,
    queuedAt: overrides.queuedAt ?? new Date("2026-07-26T10:00:00.000Z"),
    diagnosisStartedAt: overrides.diagnosisStartedAt ?? null,
    repairStartedAt: overrides.repairStartedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    failedAt: overrides.failedAt ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-07-26T10:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-07-26T10:00:00.000Z"),
  });
}

export function createExecutionOrmEntity(
  overrides: ExecutionFactoryOverrides = {},
): ExecutionOrmEntity {
  const entity = new ExecutionOrmEntity();
  entity.id = overrides.id ?? "execution-001";
  entity.saga_id = overrides.sagaId ?? "saga-001";
  entity.order_id = overrides.orderId ?? "order-001";
  entity.request_event_id = withDefault(
    overrides.requestEventId,
    "request-event-001",
  );
  entity.correlation_id = withDefault(
    overrides.correlationId,
    "correlation-001",
  );
  entity.status = overrides.status ?? ExecutionStatus.QUEUED;
  entity.failure_code = overrides.failureCode ?? null;
  entity.failure_reason = overrides.failureReason ?? null;
  entity.queued_at = overrides.queuedAt ?? new Date("2026-07-26T10:00:00.000Z");
  entity.diagnosis_started_at = overrides.diagnosisStartedAt ?? null;
  entity.repair_started_at = overrides.repairStartedAt ?? null;
  entity.finished_at = overrides.finishedAt ?? null;
  entity.failed_at = overrides.failedAt ?? null;
  entity.created_at =
    overrides.createdAt ?? new Date("2026-07-26T10:00:00.000Z");
  entity.updated_at =
    overrides.updatedAt ?? new Date("2026-07-26T10:00:00.000Z");
  return entity;
}

export function createFailExecutionDto(
  overrides: Partial<FailExecutionDto> = {},
): FailExecutionDto {
  return {
    failureCode: overrides.failureCode ?? "REPAIR_ABORTED",
    failureReason: overrides.failureReason ?? "Customer cancelled the repair.",
  };
}
