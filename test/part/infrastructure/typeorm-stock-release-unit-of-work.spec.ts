import { DataSource } from "typeorm";
import { StockReservationStatus } from "../../../src/part/domain/enums/stock-reservation-status.enum";
import { TypeOrmStockReleaseUnitOfWork } from "../../../src/part/infrastructure/persistence/typeorm-stock-release-unit-of-work";

describe("TypeOrmStockReleaseUnitOfWork", () => {
  let operations: ReturnType<typeof operationRepository>;
  let reservations: ReturnType<typeof reservationRepository>;
  let parts: ReturnType<typeof partRepository>;
  let dataSource: jest.Mocked<DataSource>;
  let unitOfWork: TypeOrmStockReleaseUnitOfWork;

  beforeEach(() => {
    operations = operationRepository();
    reservations = reservationRepository();
    parts = partRepository();
    const manager = {
      getRepository: jest.fn((entity: { name: string }) => {
        if (entity.name === "StockReleaseOperationOrmEntity") return operations;
        if (entity.name === "StockReservationOrmEntity") return reservations;
        return parts;
      }),
    };
    dataSource = {
      transaction: jest.fn(async (work) => work(manager as never)),
      getRepository: jest.fn().mockReturnValue(operations),
    } as unknown as jest.Mocked<DataSource>;
    unitOfWork = new TypeOrmStockReleaseUnitOfWork(dataSource);
  });

  it("locks and releases a RESERVED item in one transaction", async () => {
    reservations.findOne.mockResolvedValue(reservation());
    parts.findOne.mockResolvedValue(part());
    const result = await unitOfWork.execute(command(), "a".repeat(64));

    expect(result.resultEventName).toBe("stock.released");
    expect(result.resultPayload.reservations).toEqual([
      { partId: "part-1", quantity: 2, status: "RELEASED" },
    ]);
    expect(parts.save).toHaveBeenCalledWith(
      expect.objectContaining({ available_quantity: 12, reserved_quantity: 3 }),
    );
    expect(reservations.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: StockReservationStatus.RELEASED,
        released_by_event_id: "event-1",
        released_at: expect.any(Date),
      }),
    );
    expect(reservations.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: "pessimistic_write" } }),
    );
  });

  it.each([
    [null, null, "STOCK_RESERVATION_NOT_FOUND"],
    [reservation({ quantity: 3 }), null, "STOCK_RESERVATION_QUANTITY_MISMATCH"],
    [
      reservation({ status: StockReservationStatus.COMMITTED }),
      null,
      "STOCK_RESERVATION_ALREADY_COMMITTED",
    ],
    [
      reservation({ status: StockReservationStatus.FAILED }),
      null,
      "STOCK_RESERVATION_NOT_ACTIVE",
    ],
    [reservation(), null, "PART_NOT_FOUND"],
    [
      reservation(),
      part({ reserved_quantity: 1 }),
      "PART_RESERVED_STOCK_INSUFFICIENT",
    ],
  ])(
    "persists representable failure %s",
    async (reservationValue, partValue, failureCode) => {
      reservations.findOne.mockResolvedValue(reservationValue as never);
      parts.findOne.mockResolvedValue(partValue as never);
      const result = await unitOfWork.execute(command(), "a".repeat(64));
      expect(result.resultEventName).toBe("stock.release.failed");
      expect(result.resultPayload.reservations[0]).toEqual({
        partId: "part-1",
        quantity: 2,
        status: "FAILED",
        failureCode,
      });
      expect(parts.save).not.toHaveBeenCalled();
      expect(reservations.save).not.toHaveBeenCalled();
    },
  );

  it("treats a release by the same command as idempotent", async () => {
    reservations.findOne.mockResolvedValue(
      reservation({
        status: StockReservationStatus.RELEASED,
        released_by_event_id: "event-1",
      }),
    );
    const result = await unitOfWork.execute(command(), "a".repeat(64));
    expect(result.resultEventName).toBe("stock.released");
    expect(parts.findOne).not.toHaveBeenCalled();
  });

  it("reports a release by another command without changing stock", async () => {
    reservations.findOne.mockResolvedValue(
      reservation({
        status: StockReservationStatus.RELEASED,
        released_by_event_id: "other-event",
      }),
    );
    const result = await unitOfWork.execute(command(), "a".repeat(64));
    expect(result.resultPayload.reservations[0]).toMatchObject({
      status: "FAILED",
      failureCode: "STOCK_RESERVATION_ALREADY_RELEASED",
    });
  });

  it("locks in part ID order and restores output command order", async () => {
    reservations.findOne.mockImplementation(async ({ where }) =>
      reservation({ part_id: where.part_id, quantity: 1 }),
    );
    parts.findOne.mockImplementation(async ({ where }) =>
      part({ id: where.id, reserved_quantity: 5 }),
    );
    const result = await unitOfWork.execute(
      {
        ...command(),
        reservations: [
          { partId: "part-2", quantity: 1 },
          { partId: "part-1", quantity: 1 },
        ],
      },
      "a".repeat(64),
    );
    expect(
      reservations.findOne.mock.calls.map(([query]) => query.where.part_id),
    ).toEqual(["part-1", "part-2"]);
    expect(
      result.resultPayload.reservations.map(({ partId }) => partId),
    ).toEqual(["part-2", "part-1"]);
  });

  it("returns a persisted result without touching stock and rejects hash conflict", async () => {
    operations.findOneBy.mockResolvedValue(persistedOperation());
    await expect(
      unitOfWork.execute(command(), "a".repeat(64)),
    ).resolves.toMatchObject({ resultEventName: "stock.released" });
    expect(reservations.findOne).not.toHaveBeenCalled();

    await expect(
      unitOfWork.execute(command(), "b".repeat(64)),
    ).rejects.toMatchObject({ code: "STOCK_RELEASE_COMMAND_CONFLICT" });
  });

  it("propagates technical repository errors and lets the transaction roll back", async () => {
    reservations.findOne.mockRejectedValue(new Error("deadlock"));
    await expect(unitOfWork.execute(command(), "a".repeat(64))).rejects.toThrow(
      "deadlock",
    );
    expect(operations.save).not.toHaveBeenCalled();
  });
});

function command() {
  return {
    commandEventId: "event-1",
    sagaId: "saga-1",
    orderId: "order-1",
    correlationId: "correlation-1",
    reservations: [{ partId: "part-1", quantity: 2 }],
  };
}

function reservation(overrides: Record<string, unknown> = {}) {
  return {
    id: "reservation-1",
    saga_id: "saga-1",
    order_id: "order-1",
    part_id: "part-1",
    quantity: 2,
    status: StockReservationStatus.RESERVED,
    failure_code: null,
    failure_reason: null,
    released_by_event_id: null,
    released_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function part(overrides: Record<string, unknown> = {}) {
  return {
    id: "part-1",
    available_quantity: 10,
    reserved_quantity: 5,
    updated_at: new Date(),
    ...overrides,
  };
}

function persistedOperation() {
  return {
    id: "operation-1",
    command_event_id: "event-1",
    saga_id: "saga-1",
    order_id: "order-1",
    correlation_id: "correlation-1",
    command_hash: "a".repeat(64),
    result_event_name: "stock.released" as const,
    result_event_id: "b".repeat(64),
    result_occurred_at: new Date("2026-01-01T00:00:00.000Z"),
    result_payload: {
      reservations: [
        { partId: "part-1", quantity: 2, status: "RELEASED" as const },
      ],
    },
  };
}

function operationRepository() {
  return {
    findOneBy: jest.fn(),
    create: jest.fn((value) => value),
    insert: jest.fn(),
    save: jest.fn(async (value) => value),
  };
}

function reservationRepository() {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
  };
}

function partRepository() {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
  };
}
