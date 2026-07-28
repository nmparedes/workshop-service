import { Inject, Injectable } from "@nestjs/common";
import { createDeterministicEventId } from "../common/events/deterministic-event-id";
import type {
  ExecutionFailedMessage,
  ExecutionFinishedMessage,
  ExecutionStartedMessage,
} from "../contracts/order-flow.contracts";
import { EXECUTION_REPOSITORY } from "../execution/execution.tokens";
import type { ExecutionRepository } from "../execution/domain/repositories/execution.repository.interface";
import { type ExecutionEventPublisher } from "../execution/application/ports/execution-event-publisher.interface";
import { MESSAGE_PUBLISHER, type MessagePublisher } from "./rabbitmq-broker";

@Injectable()
export class ExecutionRabbitMqPublisher implements ExecutionEventPublisher {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
    @Inject(EXECUTION_REPOSITORY)
    private readonly executionRepository: ExecutionRepository,
  ) {}

  async publishStarted(executionId: string): Promise<void> {
    const execution = await this.requireExecution(executionId);
    if (!execution.diagnosisStartedAt) {
      throw new Error("Execution diagnosis timestamp is required.");
    }
    const message: ExecutionStartedMessage = {
      eventId: createDeterministicEventId(
        "execution.started",
        `${execution.sagaId}:${execution.orderId}`,
        this.requireRequestEventId(execution.requestEventId),
      ),
      eventName: "execution.started",
      eventVersion: 1,
      occurredAt: execution.diagnosisStartedAt.toISOString(),
      correlationId: this.requireCorrelationId(execution.correlationId),
      causationId: this.requireRequestEventId(execution.requestEventId),
      sagaId: execution.sagaId,
      orderId: execution.orderId,
      payload: {},
    };
    await this.publisher.publish(
      "workshop.topic",
      "execution.started",
      message,
    );
  }

  async publishFinished(executionId: string): Promise<void> {
    const execution = await this.requireExecution(executionId);
    if (!execution.finishedAt) {
      throw new Error("Execution finished timestamp is required.");
    }
    const message: ExecutionFinishedMessage = {
      eventId: createDeterministicEventId(
        "execution.finished",
        `${execution.sagaId}:${execution.orderId}`,
        this.requireRequestEventId(execution.requestEventId),
      ),
      eventName: "execution.finished",
      eventVersion: 1,
      occurredAt: execution.finishedAt.toISOString(),
      correlationId: this.requireCorrelationId(execution.correlationId),
      causationId: this.requireRequestEventId(execution.requestEventId),
      sagaId: execution.sagaId,
      orderId: execution.orderId,
      payload: {},
    };
    await this.publisher.publish(
      "workshop.topic",
      "execution.finished",
      message,
    );
  }

  async publishFailed(executionId: string, failureCode: string): Promise<void> {
    const execution = await this.requireExecution(executionId);
    if (!execution.failedAt) {
      throw new Error("Execution failed timestamp is required.");
    }
    const message: ExecutionFailedMessage = {
      eventId: createDeterministicEventId(
        "execution.failed",
        `${execution.sagaId}:${execution.orderId}`,
        this.requireRequestEventId(execution.requestEventId),
      ),
      eventName: "execution.failed",
      eventVersion: 1,
      occurredAt: execution.failedAt.toISOString(),
      correlationId: this.requireCorrelationId(execution.correlationId),
      causationId: this.requireRequestEventId(execution.requestEventId),
      sagaId: execution.sagaId,
      orderId: execution.orderId,
      payload: { failureCode },
    };
    await this.publisher.publish("workshop.topic", "execution.failed", message);
  }

  private async requireExecution(executionId: string) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found for event publication.");
    }
    return execution;
  }

  private requireRequestEventId(value: string | null): string {
    if (!value) {
      throw new Error("Execution request event context is required.");
    }
    return value;
  }

  private requireCorrelationId(value: string | null): string {
    if (!value) {
      throw new Error("Execution correlation context is required.");
    }
    return value;
  }
}
