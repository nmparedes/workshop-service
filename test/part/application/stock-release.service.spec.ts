import type { StockReleaseUnitOfWork } from "../../../src/part/application/ports/stock-release-unit-of-work.interface";
import {
  createStockReleaseCommandHash,
  createStockReleaseResultEventId,
  StockReleaseService,
} from "../../../src/part/application/services/stock-release.service";

describe("StockReleaseService", () => {
  const unitOfWork = {
    execute: jest.fn(),
  } as jest.Mocked<StockReleaseUnitOfWork>;
  const service = new StockReleaseService(unitOfWork);

  beforeEach(() => jest.clearAllMocks());

  it("normalizes a valid command and supplies its stable hash", async () => {
    unitOfWork.execute.mockResolvedValue(operation());
    await service.execute({
      ...command(),
      commandEventId: " event-1 ",
      reservations: [{ partId: " part-1 ", quantity: 2 }],
    });

    const normalized = command();
    expect(unitOfWork.execute).toHaveBeenCalledWith(
      normalized,
      createStockReleaseCommandHash(normalized),
    );
    expect(createStockReleaseCommandHash(normalized)).toHaveLength(64);
    expect(
      createStockReleaseResultEventId(
        "stock.released",
        "saga-1",
        "order-1",
        "event-1",
      ),
    ).toHaveLength(64);
  });

  it.each([
    [{ reservations: [] }, "At least one"],
    [
      {
        reservations: [
          { partId: "part-1", quantity: 1 },
          { partId: " part-1 ", quantity: 2 },
        ],
      },
      "duplicate",
    ],
    [{ reservations: [{ partId: "", quantity: 1 }] }, "part ID"],
    [{ reservations: [{ partId: "part-1", quantity: 0 }] }, "positive integer"],
    [
      { reservations: [{ partId: "part-1", quantity: 1.5 }] },
      "positive integer",
    ],
    [{ commandEventId: " " }, "command event ID"],
    [{ sagaId: " " }, "saga ID"],
    [{ orderId: " " }, "order ID"],
    [{ correlationId: " " }, "correlation ID"],
  ])("rejects an invalid command %#", async (overrides, message) => {
    await expect(
      service.execute({ ...command(), ...overrides }),
    ).rejects.toThrow(message);
    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("propagates technical unit-of-work errors", async () => {
    unitOfWork.execute.mockRejectedValue(new Error("database unavailable"));
    await expect(service.execute(command())).rejects.toThrow(
      "database unavailable",
    );
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

function operation() {
  return {
    ...command(),
    commandHash: "a".repeat(64),
    resultEventName: "stock.released" as const,
    resultEventId: "b".repeat(64),
    resultOccurredAt: new Date("2026-01-01T00:00:00.000Z"),
    resultPayload: {
      reservations: [
        { partId: "part-1", quantity: 2, status: "RELEASED" as const },
      ],
    },
  };
}
