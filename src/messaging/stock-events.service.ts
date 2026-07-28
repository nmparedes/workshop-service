import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  StockReleaseFailedMessage,
  StockReleaseRequestedMessage,
  StockReleasedMessage,
  StockReserveRequestedMessage,
  StockReservationStatePayload,
} from "../contracts/order-flow.contracts";
import { StockReservationStatus } from "../part/domain/enums/stock-reservation-status.enum";
import { StockReservationService } from "../part/application/services/stock-reservation.service";
import {
  MESSAGE_CONSUMER,
  MESSAGE_PUBLISHER,
  type BrokerMessage,
  type MessageConsumer,
  type MessagePublisher,
} from "./rabbitmq-broker";
import { TypeOrmConsumedMessageRepository } from "./consumed-message.repository";
import { createDeterministicEventId } from "./deterministic-event-id";
import { StockReleaseService } from "../part/application/services/stock-release.service";
import type { StockReleaseOperation } from "../part/application/ports/stock-release-unit-of-work.interface";

const STOCK_RESERVE_CONSUMER = "workshop-stock-reserve-requested";
const STOCK_RELEASE_CONSUMER = "workshop-stock-release-requested";

@Injectable()
export class StockEventsService implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER) private readonly consumer: MessageConsumer,
    @Inject(MESSAGE_PUBLISHER) private readonly publisher: MessagePublisher,
    private readonly stockReservations: StockReservationService,
    private readonly stockRelease: StockReleaseService,
    private readonly consumedMessages: TypeOrmConsumedMessageRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.configService.get<boolean>("MESSAGING_ENABLED", false)) return;
    await this.consumer.subscribe("workshop.stock.requests", (message) => {
      if (message.eventName === "stock.reserve.requested") {
        return this.consumeReserve(message);
      }
      if (message.eventName === "stock.release.requested") {
        return this.consumeRelease(message);
      }
      return Promise.reject(new Error("Unsupported workshop stock message."));
    });
  }

  async consumeReserve(message: BrokerMessage): Promise<void> {
    const input = this.asReserveRequested(message);
    await this.process(STOCK_RESERVE_CONSUMER, input, async () => {
      const reservations = await Promise.all(
        input.payload.reservations.map((reservation) =>
          this.stockReservations.reserveStock({
            sagaId: input.sagaId,
            orderId: input.orderId,
            ...reservation,
          }),
        ),
      );
      const payload: StockReservationStatePayload = {
        reservations: reservations.map(({ partId, quantity, failureCode }) => ({
          partId,
          quantity,
          failureCode: failureCode ?? undefined,
        })),
      };
      const eventName = reservations.some(
        (reservation) => reservation.status === StockReservationStatus.FAILED,
      )
        ? "stock.reservation.failed"
        : "stock.reserved";
      const occurredAt = reservationResultOccurredAt(reservations);
      await this.publisher.publish("workshop.topic", eventName, {
        eventId: createDeterministicEventId(
          eventName,
          `${input.sagaId}:${input.orderId}`,
          input.eventId,
        ),
        eventName,
        eventVersion: 1,
        occurredAt: occurredAt.toISOString(),
        correlationId: input.correlationId,
        causationId: input.eventId,
        sagaId: input.sagaId,
        orderId: input.orderId,
        payload,
      });
    });
  }

  async consumeRelease(message: BrokerMessage): Promise<void> {
    const input = this.asReleaseRequested(message);
    const claimed = await this.consumedMessages.claim(
      STOCK_RELEASE_CONSUMER,
      input.eventId,
    );
    if (!claimed) return;
    try {
      const operation = await this.stockRelease.execute({
        commandEventId: input.eventId,
        sagaId: input.sagaId,
        orderId: input.orderId,
        correlationId: input.correlationId,
        reservations: input.payload.reservations,
      });
      await this.publisher.publish(
        "workshop.topic",
        operation.resultEventName,
        this.releaseResultEnvelope(operation),
      );
      await this.consumedMessages.markProcessed(
        STOCK_RELEASE_CONSUMER,
        input.eventId,
        claimed.token,
      );
    } catch (error) {
      await this.consumedMessages
        .markFailed(STOCK_RELEASE_CONSUMER, input.eventId, claimed.token)
        .catch(() => undefined);
      throw error;
    }
  }

  private async process(
    consumerName: string,
    message: StockReserveRequestedMessage | StockReleaseRequestedMessage,
    operation: () => Promise<void>,
  ): Promise<void> {
    const claimed = await this.consumedMessages.claim(
      consumerName,
      message.eventId,
    );
    if (!claimed) return;
    try {
      await operation();
      await this.consumedMessages.markProcessed(
        consumerName,
        message.eventId,
        claimed.token,
      );
    } catch (error) {
      await this.consumedMessages.markFailed(
        consumerName,
        message.eventId,
        claimed.token,
      );
      throw error;
    }
  }

  private asReserveRequested(
    message: BrokerMessage,
  ): StockReserveRequestedMessage {
    return this.asStockRequest(
      message,
      "stock.reserve.requested",
    ) as StockReserveRequestedMessage;
  }

  private asReleaseRequested(
    message: BrokerMessage,
  ): StockReleaseRequestedMessage {
    if (
      message.eventName !== "stock.release.requested" ||
      message.eventVersion !== 1 ||
      !normalized(message.eventId) ||
      !validIsoTimestamp(message.occurredAt) ||
      !normalized(message.correlationId) ||
      !normalized(message.causationId) ||
      !normalized(message.sagaId) ||
      !normalized(message.orderId) ||
      !isRecord(message.payload) ||
      !Array.isArray(message.payload.reservations) ||
      message.payload.reservations.length === 0
    ) {
      throw new Error("Invalid stock.release.requested message.");
    }
    const reservations = message.payload.reservations.map((item) => {
      if (
        !isRecord(item) ||
        !normalized(item.partId) ||
        !Number.isInteger(item.quantity) ||
        Number(item.quantity) <= 0
      ) {
        throw new Error("Invalid stock.release.requested message.");
      }
      return {
        partId: normalized(item.partId)!,
        quantity: Number(item.quantity),
      };
    });
    if (
      new Set(reservations.map(({ partId }) => partId)).size !==
      reservations.length
    ) {
      throw new Error("Invalid stock.release.requested message.");
    }
    return {
      eventId: normalized(message.eventId)!,
      eventName: "stock.release.requested",
      eventVersion: 1,
      occurredAt: message.occurredAt,
      correlationId: normalized(message.correlationId)!,
      causationId: normalized(message.causationId)!,
      sagaId: normalized(message.sagaId)!,
      orderId: normalized(message.orderId)!,
      payload: { reservations },
    };
  }

  private asStockRequest(
    message: BrokerMessage,
    eventName: "stock.reserve.requested" | "stock.release.requested",
  ): StockReserveRequestedMessage | StockReleaseRequestedMessage {
    const payload = message.payload as StockReserveRequestedMessage["payload"];
    if (
      message.eventName !== eventName ||
      message.eventVersion !== 1 ||
      !message.eventId ||
      !message.correlationId ||
      !message.causationId ||
      !message.sagaId ||
      !message.orderId ||
      !Array.isArray(payload?.reservations) ||
      payload.reservations.some(
        (item) =>
          !item.partId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      throw new Error(`Invalid ${eventName} message.`);
    }
    return message as
      StockReserveRequestedMessage | StockReleaseRequestedMessage;
  }

  private releaseResultEnvelope(
    operation: StockReleaseOperation,
  ): StockReleasedMessage | StockReleaseFailedMessage {
    return {
      eventId: operation.resultEventId,
      eventName: operation.resultEventName,
      eventVersion: 1,
      occurredAt: operation.resultOccurredAt.toISOString(),
      correlationId: operation.correlationId,
      causationId: operation.commandEventId,
      sagaId: operation.sagaId,
      orderId: operation.orderId,
      payload: {
        reservations: operation.resultPayload.reservations.map((item) => ({
          ...item,
        })),
      },
    } as StockReleasedMessage | StockReleaseFailedMessage;
  }
}

function reservationResultOccurredAt(
  reservations: Array<{ createdAt: Date }>,
): Date {
  if (reservations.length === 0) {
    throw new Error(
      "A stock reservation result requires at least one reservation.",
    );
  }
  return reservations
    .slice(1)
    .reduce(
      (latest, reservation) =>
        reservation.createdAt > latest ? reservation.createdAt : latest,
      reservations[0].createdAt,
    );
}

function normalized(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result || undefined;
}

function validIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !value.includes("T")) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
