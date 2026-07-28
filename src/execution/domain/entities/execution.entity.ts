import { randomUUID } from "node:crypto";
import { DomainException } from "../../../common/exceptions/domain.exception";
import { ExecutionStatus } from "../enums/execution-status.enum";

interface ExecutionProps {
  id?: string;
  sagaId: string;
  orderId: string;
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

export class Execution {
  private readonly executionId: string;
  private readonly executionSagaId: string;
  private readonly executionOrderId: string;
  private readonly executionRequestEventId: string | null;
  private readonly executionCorrelationId: string | null;
  private executionStatus: ExecutionStatus;
  private executionFailureCode: string | null;
  private executionFailureReason: string | null;
  private readonly executionQueuedAt: Date;
  private executionDiagnosisStartedAt: Date | null;
  private executionRepairStartedAt: Date | null;
  private executionFinishedAt: Date | null;
  private executionFailedAt: Date | null;
  private readonly executionCreatedAt: Date;
  private executionUpdatedAt: Date;

  private constructor(props: ExecutionProps) {
    this.executionId = props.id ?? randomUUID();
    this.executionSagaId = requiredIdentifier("sagaId", props.sagaId);
    this.executionOrderId = requiredIdentifier("orderId", props.orderId);
    this.executionRequestEventId = optionalIdentifier(
      "requestEventId",
      props.requestEventId,
    );
    this.executionCorrelationId = optionalIdentifier(
      "correlationId",
      props.correlationId,
    );
    this.executionStatus = props.status ?? ExecutionStatus.QUEUED;
    this.executionFailureCode = props.failureCode ?? null;
    this.executionFailureReason = props.failureReason ?? null;
    this.executionQueuedAt = cloneDate(props.queuedAt ?? new Date());
    this.executionDiagnosisStartedAt = cloneNullableDate(
      props.diagnosisStartedAt,
    );
    this.executionRepairStartedAt = cloneNullableDate(props.repairStartedAt);
    this.executionFinishedAt = cloneNullableDate(props.finishedAt);
    this.executionFailedAt = cloneNullableDate(props.failedAt);
    this.executionCreatedAt = cloneDate(props.createdAt ?? new Date());
    this.executionUpdatedAt = cloneDate(props.updatedAt ?? new Date());
  }

  static create(props: Omit<ExecutionProps, "status">): Execution {
    return new Execution({
      ...props,
      status: ExecutionStatus.QUEUED,
    });
  }

  static restore(props: ExecutionProps): Execution {
    return new Execution(props);
  }

  startDiagnosis(startedAt = new Date()): void {
    if (this.executionStatus === ExecutionStatus.IN_DIAGNOSIS) {
      return;
    }
    this.ensureTransition(
      ExecutionStatus.QUEUED,
      "EXECUTION_STATUS_TRANSITION_INVALID",
      "Only queued executions can start diagnosis.",
    );
    this.executionStatus = ExecutionStatus.IN_DIAGNOSIS;
    this.executionDiagnosisStartedAt = cloneDate(startedAt);
    this.executionUpdatedAt = cloneDate(startedAt);
  }

  startRepair(startedAt = new Date()): void {
    if (this.executionStatus === ExecutionStatus.IN_REPAIR) {
      return;
    }
    this.ensureTransition(
      ExecutionStatus.IN_DIAGNOSIS,
      "EXECUTION_STATUS_TRANSITION_INVALID",
      "Only executions in diagnosis can start repair.",
    );
    this.executionStatus = ExecutionStatus.IN_REPAIR;
    this.executionRepairStartedAt = cloneDate(startedAt);
    this.executionUpdatedAt = cloneDate(startedAt);
  }

  finish(finishedAt = new Date()): void {
    if (this.executionStatus === ExecutionStatus.FINISHED) {
      return;
    }
    if (
      this.executionStatus !== ExecutionStatus.IN_DIAGNOSIS &&
      this.executionStatus !== ExecutionStatus.IN_REPAIR
    ) {
      throw new DomainException(
        "EXECUTION_STATUS_TRANSITION_INVALID",
        "Only executions in diagnosis or repair can be finished.",
      );
    }
    this.executionStatus = ExecutionStatus.FINISHED;
    this.executionFinishedAt = cloneDate(finishedAt);
    this.executionFailureCode = null;
    this.executionFailureReason = null;
    this.executionUpdatedAt = cloneDate(finishedAt);
  }

  fail(
    failureCode: string,
    failureReason?: string,
    failedAt = new Date(),
  ): void {
    const normalizedCode = sanitizeFailureCode(failureCode);
    const normalizedReason = sanitizeFailureReason(failureReason);

    if (this.executionStatus === ExecutionStatus.FAILED) {
      if (
        this.executionFailureCode === normalizedCode &&
        this.executionFailureReason === normalizedReason
      ) {
        return;
      }
      throw new DomainException(
        "EXECUTION_STATUS_TRANSITION_INVALID",
        "A failed execution cannot be failed again with a different reason.",
      );
    }

    if (this.isTerminal()) {
      throw new DomainException(
        "EXECUTION_STATUS_TRANSITION_INVALID",
        "Terminal executions cannot transition to failed.",
      );
    }

    this.executionStatus = ExecutionStatus.FAILED;
    this.executionFailureCode = normalizedCode;
    this.executionFailureReason = normalizedReason;
    this.executionFailedAt = cloneDate(failedAt);
    this.executionUpdatedAt = cloneDate(failedAt);
  }

  private ensureTransition(
    expectedStatus: ExecutionStatus,
    code: string,
    message: string,
  ): void {
    if (this.isTerminal()) {
      throw new DomainException(
        "EXECUTION_STATUS_TRANSITION_INVALID",
        "Terminal executions cannot transition to another state.",
      );
    }
    if (this.executionStatus !== expectedStatus) {
      throw new DomainException(code, message, {
        currentStatus: this.executionStatus,
      });
    }
  }

  private isTerminal(): boolean {
    return (
      this.executionStatus === ExecutionStatus.FINISHED ||
      this.executionStatus === ExecutionStatus.FAILED
    );
  }

  get id(): string {
    return this.executionId;
  }

  get sagaId(): string {
    return this.executionSagaId;
  }

  get orderId(): string {
    return this.executionOrderId;
  }

  get status(): ExecutionStatus {
    return this.executionStatus;
  }

  get requestEventId(): string | null {
    return this.executionRequestEventId;
  }

  get correlationId(): string | null {
    return this.executionCorrelationId;
  }

  get failureCode(): string | null {
    return this.executionFailureCode;
  }

  get failureReason(): string | null {
    return this.executionFailureReason;
  }

  get queuedAt(): Date {
    return cloneDate(this.executionQueuedAt);
  }

  get diagnosisStartedAt(): Date | null {
    return cloneNullableDate(this.executionDiagnosisStartedAt);
  }

  get repairStartedAt(): Date | null {
    return cloneNullableDate(this.executionRepairStartedAt);
  }

  get finishedAt(): Date | null {
    return cloneNullableDate(this.executionFinishedAt);
  }

  get failedAt(): Date | null {
    return cloneNullableDate(this.executionFailedAt);
  }

  get createdAt(): Date {
    return cloneDate(this.executionCreatedAt);
  }

  get updatedAt(): Date {
    return cloneDate(this.executionUpdatedAt);
  }
}

function requiredIdentifier(field: string, value: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new DomainException(
      "EXECUTION_IDENTIFIER_REQUIRED",
      `${field} is required.`,
      { field },
    );
  }
  return normalized;
}

function optionalIdentifier(
  field: string,
  value?: string | null,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new DomainException(
      "EXECUTION_IDENTIFIER_REQUIRED",
      `${field} is required.`,
      { field },
    );
  }
  return normalized;
}

function sanitizeFailureCode(value: string): string {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    throw new DomainException(
      "EXECUTION_FAILURE_CODE_REQUIRED",
      "Failure code is required.",
    );
  }
  return normalized.replace(/\s+/g, "_").slice(0, 100);
}

function sanitizeFailureReason(value?: string): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, 500);
}

function cloneDate(value: Date): Date {
  return new Date(value);
}

function cloneNullableDate(value?: Date | null): Date | null {
  return value ? new Date(value) : null;
}
