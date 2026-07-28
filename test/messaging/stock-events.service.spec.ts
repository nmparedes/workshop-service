import type { StockReleaseService } from "../../src/part/application/services/stock-release.service";
import { StockReservationService } from "../../src/part/application/services/stock-reservation.service";
import { StockEventsService } from "../../src/messaging/stock-events.service";
import { TypeOrmConsumedMessageRepository } from "../../src/messaging/consumed-message.repository";

const consumer = { subscribe: jest.fn() };
const publisher = { publish: jest.fn() };
const reservations = {
  reserveStock: jest.fn(),
} as unknown as jest.Mocked<StockReservationService>;
const stockRelease = {
  execute: jest.fn(),
} as unknown as jest.Mocked<StockReleaseService>;
const consumedMessages = {
  claim: jest.fn(),
  markProcessed: jest.fn(),
  markFailed: jest.fn(),
} as unknown as jest.Mocked<TypeOrmConsumedMessageRepository>;

describe("StockEventsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumedMessages.markFailed.mockResolvedValue(undefined);
    consumedMessages.markProcessed.mockResolvedValue(undefined);
    publisher.publish.mockResolvedValue(undefined);
  });

  it("reserves stock and preserves the existing deterministic result", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    reservations.reserveStock.mockResolvedValue(reservationResult());
    await service().consumeReserve(reserveRequest());
    expect(reservations.reserveStock).toHaveBeenCalledWith({
      sagaId: "saga-1",
      orderId: "order-1",
      partId: "part-1",
      quantity: 2,
    });
    expect(publisher.publish).toHaveBeenCalledWith(
      "workshop.topic",
      "stock.reserved",
      expect.objectContaining({
        occurredAt: "2026-01-01T00:00:00.000Z",
        correlationId: "correlation-1",
        causationId: "event-1",
        sagaId: "saga-1",
        orderId: "order-1",
      }),
    );
  });

  it("publishes a persisted stock.released result and completes the claim after confirm", async () => {
    const calls: string[] = [];
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    stockRelease.execute.mockResolvedValue(releaseOperation());
    publisher.publish.mockImplementation(async () => {
      calls.push("published");
    });
    consumedMessages.markProcessed.mockImplementation(async () => {
      calls.push("processed");
    });

    await service().consumeRelease(releaseRequest());

    expect(stockRelease.execute).toHaveBeenCalledWith({
      commandEventId: "event-1",
      sagaId: "saga-1",
      orderId: "order-1",
      correlationId: "correlation-1",
      reservations: [{ partId: "part-1", quantity: 2 }],
    });
    expect(publisher.publish).toHaveBeenCalledWith(
      "workshop.topic",
      "stock.released",
      {
        eventId: "result-event-1",
        eventName: "stock.released",
        eventVersion: 1,
        occurredAt: "2026-01-02T00:00:00.000Z",
        correlationId: "correlation-1",
        causationId: "event-1",
        sagaId: "saga-1",
        orderId: "order-1",
        payload: {
          reservations: [{ partId: "part-1", quantity: 2, status: "RELEASED" }],
        },
      },
    );
    expect(calls).toEqual(["published", "processed"]);
  });

  it("publishes a mixed persisted stock.release.failed result in command order", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    stockRelease.execute.mockResolvedValue(
      releaseOperation({
        resultEventName: "stock.release.failed",
        resultEventId: "failed-event-1",
        resultPayload: {
          reservations: [
            { partId: "part-2", quantity: 1, status: "RELEASED" },
            {
              partId: "part-1",
              quantity: 2,
              status: "FAILED",
              failureCode: "STOCK_RESERVATION_NOT_FOUND",
            },
          ],
        },
      }),
    );
    await service().consumeRelease(
      releaseRequest([
        { partId: "part-2", quantity: 1 },
        { partId: "part-1", quantity: 2 },
      ]),
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      "workshop.topic",
      "stock.release.failed",
      expect.objectContaining({
        eventId: "failed-event-1",
        payload: {
          reservations: [
            { partId: "part-2", quantity: 1, status: "RELEASED" },
            {
              partId: "part-1",
              quantity: 2,
              status: "FAILED",
              failureCode: "STOCK_RESERVATION_NOT_FOUND",
            },
          ],
        },
      }),
    );
  });

  it.each([
    { eventId: "" },
    { eventName: "stock.reserve.requested" },
    { eventVersion: 2 },
    { occurredAt: "not-a-date" },
    { correlationId: " " },
    { causationId: "" },
    { sagaId: "" },
    { orderId: "" },
    { payload: { reservations: [] } },
    { payload: { reservations: [{ partId: "", quantity: 1 }] } },
    { payload: { reservations: [{ partId: "part-1", quantity: 0 }] } },
    { payload: { reservations: [{ partId: "part-1", quantity: 1.5 }] } },
    {
      payload: {
        reservations: [
          { partId: "part-1", quantity: 1 },
          { partId: " part-1 ", quantity: 1 },
        ],
      },
    },
  ])("rejects invalid release input before claiming %#", async (override) => {
    await expect(
      service().consumeRelease({ ...releaseRequest(), ...override } as never),
    ).rejects.toThrow("Invalid stock.release.requested");
    expect(consumedMessages.claim).not.toHaveBeenCalled();
    expect(stockRelease.execute).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("does nothing for a previously processed message", async () => {
    consumedMessages.claim.mockResolvedValue(null);
    await service().consumeRelease(releaseRequest());
    expect(stockRelease.execute).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("propagates an occupied claim without applying or publishing", async () => {
    consumedMessages.claim.mockRejectedValue(
      new Error("Consumed message is already processing."),
    );
    await expect(service().consumeRelease(releaseRequest())).rejects.toThrow(
      "already processing",
    );
    expect(stockRelease.execute).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it.each(["database unavailable", "deadlock"])(
    "keeps technical error %s on retry/DLQ without a business event",
    async (message) => {
      consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
      stockRelease.execute.mockRejectedValue(new Error(message));
      await expect(service().consumeRelease(releaseRequest())).rejects.toThrow(
        message,
      );
      expect(consumedMessages.markFailed).toHaveBeenCalledWith(
        "workshop-stock-release-requested",
        "event-1",
        "claim-1",
      );
      expect(publisher.publish).not.toHaveBeenCalled();
    },
  );

  it("marks publication failure for retry and reuses the persisted envelope", async () => {
    consumedMessages.claim
      .mockResolvedValueOnce({ token: "claim-1" })
      .mockResolvedValueOnce({ token: "claim-2" });
    stockRelease.execute.mockResolvedValue(releaseOperation());
    publisher.publish
      .mockRejectedValueOnce(new Error("publisher confirm rejected"))
      .mockResolvedValue(undefined);

    await expect(service().consumeRelease(releaseRequest())).rejects.toThrow(
      "publisher confirm rejected",
    );
    await service().consumeRelease(releaseRequest());

    expect(stockRelease.execute).toHaveBeenCalledTimes(2);
    expect(publisher.publish.mock.calls[0]).toEqual(
      publisher.publish.mock.calls[1],
    );
    expect(consumedMessages.markFailed).toHaveBeenCalledWith(
      "workshop-stock-release-requested",
      "event-1",
      "claim-1",
    );
  });

  it("re-publishes the same envelope when completion fails after confirm", async () => {
    consumedMessages.claim
      .mockResolvedValueOnce({ token: "claim-1" })
      .mockResolvedValueOnce({ token: "claim-2" });
    stockRelease.execute.mockResolvedValue(releaseOperation());
    consumedMessages.markProcessed.mockRejectedValueOnce(
      new Error("claim completion failed"),
    );

    await expect(service().consumeRelease(releaseRequest())).rejects.toThrow(
      "claim completion failed",
    );
    await service().consumeRelease(releaseRequest());
    expect(publisher.publish.mock.calls[0]).toEqual(
      publisher.publish.mock.calls[1],
    );
  });

  it("does not let an old worker silently complete a recovered claim", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "old-token" });
    stockRelease.execute.mockResolvedValue(releaseOperation());
    consumedMessages.markProcessed.mockRejectedValue(
      new Error("Consumed message claim was lost before completion."),
    );
    consumedMessages.markFailed.mockRejectedValue(
      new Error("Consumed message claim was lost before failure."),
    );
    await expect(service().consumeRelease(releaseRequest())).rejects.toThrow(
      "claim was lost",
    );
  });

  it("registers the existing dispatcher only when messaging is enabled", async () => {
    await service(false).onModuleInit();
    expect(consumer.subscribe).not.toHaveBeenCalled();

    await service(true).onModuleInit();
    expect(consumer.subscribe).toHaveBeenCalledWith(
      "workshop.stock.requests",
      expect.any(Function),
    );
  });
});

function service(enabled = false): StockEventsService {
  return new StockEventsService(
    consumer,
    publisher,
    reservations,
    stockRelease,
    consumedMessages,
    { get: jest.fn().mockReturnValue(enabled) } as never,
  );
}

function reserveRequest() {
  return {
    eventId: "event-1",
    eventName: "stock.reserve.requested",
    eventVersion: 1,
    occurredAt: "2026-01-01T00:00:00.000Z",
    correlationId: "correlation-1",
    causationId: "cause-1",
    sagaId: "saga-1",
    orderId: "order-1",
    payload: { reservations: [{ partId: "part-1", quantity: 2 }] },
  };
}

function releaseRequest(reservations = [{ partId: "part-1", quantity: 2 }]) {
  return {
    ...reserveRequest(),
    eventName: "stock.release.requested" as const,
    payload: { reservations },
  };
}

function reservationResult(overrides: Record<string, unknown> = {}) {
  return {
    id: "reservation-1",
    sagaId: "saga-1",
    orderId: "order-1",
    partId: "part-1",
    quantity: 2,
    status: "RESERVED",
    failureCode: null,
    failureReason: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as never;
}

function releaseOperation(overrides: Record<string, unknown> = {}) {
  return {
    commandEventId: "event-1",
    sagaId: "saga-1",
    orderId: "order-1",
    correlationId: "correlation-1",
    commandHash: "a".repeat(64),
    resultEventName: "stock.released",
    resultEventId: "result-event-1",
    resultOccurredAt: new Date("2026-01-02T00:00:00.000Z"),
    resultPayload: {
      reservations: [{ partId: "part-1", quantity: 2, status: "RELEASED" }],
    },
    ...overrides,
  } as never;
}
