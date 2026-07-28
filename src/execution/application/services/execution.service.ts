import { Inject, Injectable } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";
import {
  EXECUTION_EVENT_PUBLISHER,
  type ExecutionEventPublisher,
} from "../ports/execution-event-publisher.interface";
import { Execution } from "../../domain/entities/execution.entity";
import type { ExecutionRepository } from "../../domain/repositories/execution.repository.interface";
import { EXECUTION_REPOSITORY } from "../../execution.tokens";
import { ExecutionQueryDto } from "../dto/execution-query.dto";
import { ExecutionResponseDto } from "../dto/execution-response.dto";
import { FailExecutionDto } from "../dto/fail-execution.dto";
import {
  EXECUTION_METRICS,
  type ExecutionMetrics,
} from "../ports/execution-metrics.port";

@Injectable()
export class ExecutionService {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executionRepository: ExecutionRepository,
    @Inject(EXECUTION_EVENT_PUBLISHER)
    private readonly executionEventPublisher: ExecutionEventPublisher,
    @Inject(EXECUTION_METRICS)
    private readonly executionMetrics: ExecutionMetrics,
  ) {}

  async createQueuedExecution(
    sagaId: string,
    orderId: string,
    requestEventId?: string,
    correlationId?: string,
  ): Promise<ExecutionResponseDto> {
    const normalizedSagaId = requiredIdentifier("sagaId", sagaId);
    const normalizedOrderId = requiredIdentifier("orderId", orderId);
    const normalizedRequestEventId = optionalIdentifier(
      "requestEventId",
      requestEventId,
    );
    const normalizedCorrelationId = optionalIdentifier(
      "correlationId",
      correlationId,
    );

    const [existingBySagaId, existingByOrderId] = await Promise.all([
      this.executionRepository.findBySagaId(normalizedSagaId),
      this.executionRepository.findByOrderId(normalizedOrderId),
    ]);

    if (existingBySagaId && existingByOrderId) {
      if (
        existingBySagaId.id === existingByOrderId.id &&
        existingBySagaId.orderId === normalizedOrderId &&
        existingByOrderId.sagaId === normalizedSagaId &&
        existingBySagaId.requestEventId === normalizedRequestEventId &&
        existingBySagaId.correlationId === normalizedCorrelationId
      ) {
        return this.toResponseDto(existingBySagaId);
      }

      throw new DomainException(
        "EXECUTION_IDENTITY_CONFLICT",
        "Execution identity conflicts with an existing record.",
      );
    }

    if (existingBySagaId || existingByOrderId) {
      throw new DomainException(
        "EXECUTION_IDENTITY_CONFLICT",
        "Execution identity conflicts with an existing record.",
      );
    }

    const execution = Execution.create({
      sagaId: normalizedSagaId,
      orderId: normalizedOrderId,
      requestEventId: normalizedRequestEventId,
      correlationId: normalizedCorrelationId,
    });

    return this.toResponseDto(await this.executionRepository.save(execution));
  }

  async findAll(query: ExecutionQueryDto): Promise<ExecutionResponseDto[]> {
    return (await this.executionRepository.findAll(query)).map((execution) =>
      this.toResponseDto(execution),
    );
  }

  async findById(id: string): Promise<ExecutionResponseDto> {
    const execution = await this.loadExecution(id);
    return this.toResponseDto(execution);
  }

  async findByOrderId(orderId: string): Promise<ExecutionResponseDto | null> {
    const execution = await this.executionRepository.findByOrderId(
      requiredIdentifier("orderId", orderId),
    );
    return execution ? this.toResponseDto(execution) : null;
  }

  async startDiagnosis(id: string): Promise<ExecutionResponseDto> {
    const execution = await this.loadExecution(id);
    let persistedExecution = execution;
    if (execution.status !== "IN_DIAGNOSIS") {
      execution.startDiagnosis();
      persistedExecution = await this.executionRepository.save(execution);
      observeDurationForDiagnosis(persistedExecution, this.executionMetrics);
    }
    await this.executionEventPublisher.publishStarted(persistedExecution.id);
    return this.toResponseDto(persistedExecution);
  }

  async startRepair(id: string): Promise<ExecutionResponseDto> {
    const execution = await this.loadExecution(id);
    execution.startRepair();
    const persistedExecution = await this.executionRepository.save(execution);
    observeDurationForRepair(persistedExecution, this.executionMetrics);
    return this.toResponseDto(persistedExecution);
  }

  async finish(id: string): Promise<ExecutionResponseDto> {
    const execution = await this.loadExecution(id);
    let persistedExecution = execution;
    if (execution.status !== "FINISHED") {
      execution.finish();
      persistedExecution = await this.executionRepository.save(execution);
      observeDurationForFinish(persistedExecution, this.executionMetrics);
    }
    await this.executionEventPublisher.publishFinished(persistedExecution.id);
    return this.toResponseDto(persistedExecution);
  }

  async fail(id: string, dto: FailExecutionDto): Promise<ExecutionResponseDto> {
    const execution = await this.loadExecution(id);
    const normalizedCode = normalizeFailureCode(dto.failureCode);
    const normalizedReason = normalizeFailureReason(dto.failureReason);
    let persistedExecution = execution;
    if (
      execution.status !== "FAILED" ||
      execution.failureCode !== normalizedCode ||
      execution.failureReason !== normalizedReason
    ) {
      execution.fail(normalizedCode, normalizedReason ?? undefined);
      persistedExecution = await this.executionRepository.save(execution);
    }
    await this.executionEventPublisher.publishFailed(
      persistedExecution.id,
      normalizedCode,
    );
    return this.toResponseDto(persistedExecution);
  }

  private async loadExecution(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findById(
      requiredIdentifier("executionId", id),
    );
    if (!execution) {
      throw new DomainException(
        "EXECUTION_NOT_FOUND",
        "Execution was not found.",
        { id },
      );
    }
    return execution;
  }

  private toResponseDto(execution: Execution): ExecutionResponseDto {
    return {
      id: execution.id,
      sagaId: execution.sagaId,
      orderId: execution.orderId,
      requestEventId: execution.requestEventId,
      correlationId: execution.correlationId,
      status: execution.status,
      failureCode: execution.failureCode,
      failureReason: execution.failureReason,
      queuedAt: execution.queuedAt,
      diagnosisStartedAt: execution.diagnosisStartedAt,
      repairStartedAt: execution.repairStartedAt,
      finishedAt: execution.finishedAt,
      failedAt: execution.failedAt,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  }
}

function observeDurationForDiagnosis(
  execution: Execution,
  metrics: ExecutionMetrics,
): void {
  if (!execution.diagnosisStartedAt) return;
  metrics.observeDuration(
    "diagnosis",
    secondsBetween(execution.queuedAt, execution.diagnosisStartedAt),
  );
}

function observeDurationForRepair(
  execution: Execution,
  metrics: ExecutionMetrics,
): void {
  if (!execution.diagnosisStartedAt || !execution.repairStartedAt) return;
  metrics.observeDuration(
    "repair",
    secondsBetween(execution.diagnosisStartedAt, execution.repairStartedAt),
  );
}

function observeDurationForFinish(
  execution: Execution,
  metrics: ExecutionMetrics,
): void {
  if (!execution.finishedAt) return;
  const start = execution.repairStartedAt ?? execution.diagnosisStartedAt;
  if (!start) return;
  metrics.observeDuration(
    "finished",
    secondsBetween(start, execution.finishedAt),
  );
}

function secondsBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 1000;
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

function normalizeFailureCode(value: string): string {
  return requiredIdentifier("failureCode", value)
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeFailureReason(value?: string): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 500) : null;
}
