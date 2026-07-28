import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ExecutionRequestedMessage } from "../contracts/order-flow.contracts";
import { ExecutionService } from "../execution/application/services/execution.service";
import {
  MESSAGE_CONSUMER,
  type BrokerMessage,
  type MessageConsumer,
} from "./rabbitmq-broker";
import { TypeOrmConsumedMessageRepository } from "./consumed-message.repository";

const EXECUTION_REQUEST_CONSUMER = "workshop-execution-requested";

@Injectable()
export class ExecutionEventsService implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly consumer: MessageConsumer,
    private readonly executionService: ExecutionService,
    private readonly consumedMessages: TypeOrmConsumedMessageRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.configService.get<boolean>("MESSAGING_ENABLED", false)) {
      return;
    }
    await this.consumer.subscribe("workshop.execution.requests", (message) =>
      this.consumeExecutionRequested(message),
    );
  }

  async consumeExecutionRequested(message: BrokerMessage): Promise<void> {
    const input = asExecutionRequested(message);
    const claim = await this.consumedMessages.claim(
      EXECUTION_REQUEST_CONSUMER,
      input.eventId,
    );
    if (!claim) {
      return;
    }

    try {
      await this.executionService.createQueuedExecution(
        input.sagaId,
        input.orderId,
        input.eventId,
        input.correlationId,
      );
      await this.consumedMessages.markProcessed(
        EXECUTION_REQUEST_CONSUMER,
        input.eventId,
        claim.token,
      );
    } catch (error) {
      await this.consumedMessages
        .markFailed(EXECUTION_REQUEST_CONSUMER, input.eventId, claim.token)
        .catch(() => undefined);
      throw error;
    }
  }
}

function asExecutionRequested(
  message: BrokerMessage,
): ExecutionRequestedMessage {
  if (
    !message.eventId?.trim() ||
    message.eventName !== "execution.requested" ||
    message.eventVersion !== 1 ||
    Number.isNaN(Date.parse(message.occurredAt)) ||
    !message.correlationId?.trim() ||
    !message.causationId?.trim() ||
    !message.sagaId?.trim() ||
    !message.orderId?.trim() ||
    !isEmptyPayload(message.payload)
  ) {
    throw new Error("Invalid execution.requested message.");
  }

  return {
    eventId: message.eventId.trim(),
    eventName: "execution.requested",
    eventVersion: 1,
    occurredAt: message.occurredAt,
    correlationId: message.correlationId.trim(),
    causationId: message.causationId.trim(),
    sagaId: message.sagaId.trim(),
    orderId: message.orderId.trim(),
    payload: {},
  };
}

function isEmptyPayload(payload: unknown): payload is Record<string, never> {
  return (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0
  );
}
