import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";
import { createDeterministicEventId } from "../../../common/events/deterministic-event-id";
import {
  type StockReleaseCommand,
  type StockReleaseCommandItem,
  type StockReleaseOperation,
  type StockReleaseUnitOfWork,
} from "../ports/stock-release-unit-of-work.interface";
import { STOCK_RELEASE_UNIT_OF_WORK } from "../../part.tokens";

@Injectable()
export class StockReleaseService {
  constructor(
    @Inject(STOCK_RELEASE_UNIT_OF_WORK)
    private readonly unitOfWork: StockReleaseUnitOfWork,
  ) {}

  async execute(command: StockReleaseCommand): Promise<StockReleaseOperation> {
    const normalized = normalizeCommand(command);
    return this.unitOfWork.execute(
      normalized,
      createStockReleaseCommandHash(normalized),
    );
  }
}

export function createStockReleaseCommandHash(
  command: StockReleaseCommand,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        commandEventId: command.commandEventId,
        sagaId: command.sagaId,
        orderId: command.orderId,
        correlationId: command.correlationId,
        reservations: command.reservations,
      }),
    )
    .digest("hex");
}

export function createStockReleaseResultEventId(
  eventName: "stock.released" | "stock.release.failed",
  sagaId: string,
  orderId: string,
  commandEventId: string,
): string {
  return createDeterministicEventId(
    eventName,
    `${sagaId}:${orderId}`,
    commandEventId,
  );
}

function normalizeCommand(command: StockReleaseCommand): StockReleaseCommand {
  const reservations = command.reservations.map((item) => normalizeItem(item));
  if (reservations.length === 0) {
    throw new DomainException(
      "STOCK_RELEASE_INVALID",
      "At least one stock reservation is required.",
    );
  }
  if (
    new Set(reservations.map(({ partId }) => partId)).size !==
    reservations.length
  ) {
    throw new DomainException(
      "STOCK_RELEASE_INVALID",
      "Stock release reservations cannot contain duplicate part IDs.",
    );
  }
  return {
    commandEventId: required(command.commandEventId, "command event ID"),
    sagaId: required(command.sagaId, "saga ID"),
    orderId: required(command.orderId, "order ID"),
    correlationId: required(command.correlationId, "correlation ID"),
    reservations,
  };
}

function normalizeItem(item: StockReleaseCommandItem): StockReleaseCommandItem {
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new DomainException(
      "STOCK_RELEASE_INVALID",
      "Stock release quantity must be a positive integer.",
    );
  }
  return {
    partId: required(item.partId, "part ID"),
    quantity: item.quantity,
  };
}

function required(value: string, field: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new DomainException(
      "STOCK_RELEASE_INVALID",
      `The ${field} is required.`,
    );
  }
  return normalized;
}
