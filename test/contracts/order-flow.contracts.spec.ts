import type {
  StockReserveRequestedMessage,
  StockReservationFailedMessage,
  StockReleaseFailedMessage,
  StockReleasedMessage,
} from "../../src/contracts/order-flow.contracts";

describe("Order flow contracts", () => {
  it("defines the consumed stock reservation command", () => {
    const message: StockReserveRequestedMessage = {
      eventId: "event-001",
      eventName: "stock.reserve.requested",
      eventVersion: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      correlationId: "correlation-001",
      causationId: "cause-001",
      sagaId: "saga-001",
      orderId: "order-001",
      payload: { reservations: [{ partId: "part-001", quantity: 2 }] },
    };

    expect(message.payload.reservations[0]).toEqual({
      partId: "part-001",
      quantity: 2,
    });
  });

  it("defines the published stock failure event", () => {
    const message: StockReservationFailedMessage = {
      eventId: "event-002",
      eventName: "stock.reservation.failed",
      eventVersion: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      correlationId: "correlation-001",
      causationId: "event-001",
      sagaId: "saga-001",
      orderId: "order-001",
      payload: {
        reservations: [
          {
            partId: "part-001",
            quantity: 2,
            failureCode: "INSUFFICIENT_STOCK",
          },
        ],
      },
    };

    expect(message.payload.reservations[0].failureCode).toBe(
      "INSUFFICIENT_STOCK",
    );
  });

  it("keeps release compensation outcomes structurally compatible with OS", () => {
    const released: StockReleasedMessage = {
      eventId: "event-003",
      eventName: "stock.released",
      eventVersion: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      correlationId: "correlation-001",
      causationId: "event-001",
      sagaId: "saga-001",
      orderId: "order-001",
      payload: {
        reservations: [{ partId: "part-001", quantity: 2, status: "RELEASED" }],
      },
    };
    const failed: StockReleaseFailedMessage = {
      ...released,
      eventId: "event-004",
      eventName: "stock.release.failed",
      payload: {
        reservations: [
          {
            partId: "part-001",
            quantity: 2,
            status: "FAILED",
            failureCode: "PART_NOT_FOUND",
          },
        ],
      },
    };

    expect(released.payload.reservations[0].status).toBe("RELEASED");
    expect(failed.payload.reservations[0].failureCode).toBe("PART_NOT_FOUND");
  });
});
