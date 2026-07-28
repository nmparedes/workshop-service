import { StockReleaseOperationMapper } from "../../../src/part/infrastructure/mappers/stock-release-operation.mapper";
import { StockReleaseOperationOrmEntity } from "../../../src/part/infrastructure/typeorm/stock-release-operation.orm-entity";

describe("StockReleaseOperationMapper", () => {
  it("maps a complete persisted snapshot using defensive copies", () => {
    const entity = persistedEntity();
    const mapped = StockReleaseOperationMapper.toApplication(entity);
    entity.result_payload!.reservations[0].quantity = 99;
    entity.result_occurred_at!.setUTCFullYear(2000);

    expect(mapped.resultOccurredAt.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(mapped.resultPayload.reservations[0].quantity).toBe(2);
  });

  it.each([
    { result_event_name: null },
    { result_event_id: null },
    { result_occurred_at: null },
    { result_payload: null },
  ])("rejects an incomplete persisted operation", (override) => {
    expect(() =>
      StockReleaseOperationMapper.toApplication(
        Object.assign(persistedEntity(), override),
      ),
    ).toThrow("incomplete");
  });
});

function persistedEntity(): StockReleaseOperationOrmEntity {
  return Object.assign(new StockReleaseOperationOrmEntity(), {
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
    created_at: new Date(),
    updated_at: new Date(),
  });
}
