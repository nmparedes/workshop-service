import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import workshopServiceDataSource from "../../../src/database/typeorm-cli.config";
import { ConsumedMessageOrmEntity } from "../../../src/messaging/consumed-message.orm-entity";
import { TypeOrmConsumedMessageRepository } from "../../../src/messaging/consumed-message.repository";
import { StockEventsService } from "../../../src/messaging/stock-events.service";
import { StockReleaseService } from "../../../src/part/application/services/stock-release.service";
import { StockReservationStatus } from "../../../src/part/domain/enums/stock-reservation-status.enum";
import { TypeOrmStockReleaseUnitOfWork } from "../../../src/part/infrastructure/persistence/typeorm-stock-release-unit-of-work";
import { PartOrmEntity } from "../../../src/part/infrastructure/typeorm/part.orm-entity";
import { StockReleaseOperationOrmEntity } from "../../../src/part/infrastructure/typeorm/stock-release-operation.orm-entity";
import { StockReservationOrmEntity } from "../../../src/part/infrastructure/typeorm/stock-reservation.orm-entity";

const describeMySql =
  process.env.RUN_MYSQL_INTEGRATION === "true" ? describe : describe.skip;

describeMySql("Observable stock release MySQL integration", () => {
  let dataSource: DataSource;
  let releaseService: StockReleaseService;

  beforeAll(async () => {
    dataSource = workshopServiceDataSource;
    await dataSource.initialize();
    await dataSource.runMigrations();
    releaseService = new StockReleaseService(
      new TypeOrmStockReleaseUnitOfWork(dataSource),
    );
  });

  beforeEach(async () => {
    await dataSource
      .query(
        "ALTER TABLE stock_release_operations DROP CHECK fail_stock_release_update",
      )
      .catch(() => undefined);
    await dataSource.getRepository(ConsumedMessageOrmEntity).clear();
    await dataSource.getRepository(StockReleaseOperationOrmEntity).clear();
    await dataSource.getRepository(StockReservationOrmEntity).clear();
    await dataSource.getRepository(PartOrmEntity).clear();
  });

  afterAll(async () => {
    await dataSource
      .query(
        "ALTER TABLE stock_release_operations DROP CHECK fail_stock_release_update",
      )
      .catch(() => undefined);
    await dataSource.destroy();
  });

  it("commits stock, reservation and result before publish and recovers an identical envelope", async () => {
    await seedReserved("part-1", 2);
    const publisher = {
      publish: jest
        .fn()
        .mockRejectedValueOnce(new Error("publisher confirm rejected"))
        .mockResolvedValue(undefined),
    };
    const handler = stockHandler(publisher);

    await expect(handler.consumeRelease(message("event-1"))).rejects.toThrow(
      "publisher confirm rejected",
    );
    const afterCommit = await persistedState("part-1");
    expect(afterCommit.part).toMatchObject({
      available_quantity: 12,
      reserved_quantity: 3,
    });
    expect(afterCommit.reservation).toMatchObject({
      status: StockReservationStatus.RELEASED,
      released_by_event_id: "event-1",
      released_at: expect.any(Date),
    });
    expect(afterCommit.operation).toMatchObject({
      command_event_id: "event-1",
      result_event_name: "stock.released",
      result_payload: {
        reservations: [{ partId: "part-1", quantity: 2, status: "RELEASED" }],
      },
    });

    const restartedHandler = stockHandler(publisher);
    await restartedHandler.consumeRelease(message("event-1"));
    const afterRetry = await persistedState("part-1");
    expect(afterRetry.part).toMatchObject({
      available_quantity: 12,
      reserved_quantity: 3,
    });
    expect(publisher.publish.mock.calls[0]).toEqual(
      publisher.publish.mock.calls[1],
    );
    expect(publisher.publish.mock.calls[1][2]).toMatchObject({
      eventId: afterCommit.operation!.result_event_id,
      occurredAt: afterCommit.operation!.result_occurred_at!.toISOString(),
    });
  });

  it("persists a mixed result atomically and preserves command order", async () => {
    await seedReserved("part-1", 2);
    const result = await releaseService.execute(
      command("event-mixed", [
        { partId: "missing-part", quantity: 1 },
        { partId: "part-1", quantity: 2 },
      ]),
    );
    expect(result.resultEventName).toBe("stock.release.failed");
    expect(result.resultPayload.reservations).toEqual([
      {
        partId: "missing-part",
        quantity: 1,
        status: "FAILED",
        failureCode: "STOCK_RESERVATION_NOT_FOUND",
      },
      { partId: "part-1", quantity: 2, status: "RELEASED" },
    ]);
    expect((await persistedState("part-1")).part).toMatchObject({
      available_quantity: 12,
      reserved_quantity: 3,
    });
  });

  it("allows one physical release for concurrent deliveries of the same command", async () => {
    await seedReserved("part-1", 2);
    const [first, second] = await Promise.all([
      releaseService.execute(command("event-concurrent")),
      releaseService.execute(command("event-concurrent")),
    ]);
    expect(second).toEqual(first);
    expect((await persistedState("part-1")).part).toMatchObject({
      available_quantity: 12,
      reserved_quantity: 3,
    });
    expect(
      await dataSource.getRepository(StockReleaseOperationOrmEntity).count(),
    ).toBe(1);
  });

  it("does not release twice for different concurrent commands", async () => {
    await seedReserved("part-1", 2);
    const results = await Promise.all([
      releaseService.execute(command("event-a")),
      releaseService.execute(command("event-b")),
    ]);
    expect(
      results.map(({ resultEventName }) => resultEventName).sort(),
    ).toEqual(["stock.release.failed", "stock.released"]);
    expect(
      results
        .flatMap(({ resultPayload }) => resultPayload.reservations)
        .find(({ status }) => status === "FAILED"),
    ).toMatchObject({
      failureCode: "STOCK_RESERVATION_ALREADY_RELEASED",
    });
    expect((await persistedState("part-1")).part).toMatchObject({
      available_quantity: 12,
      reserved_quantity: 3,
    });
  });

  it("rejects the same command ID with different normalized content", async () => {
    await seedReserved("part-1", 2);
    await releaseService.execute(command("event-conflict"));
    await expect(
      releaseService.execute({
        ...command("event-conflict"),
        correlationId: "another-correlation",
      }),
    ).rejects.toMatchObject({ code: "STOCK_RELEASE_COMMAND_CONFLICT" });
  });

  it("rolls back part, reservation and operation on a technical database error", async () => {
    await seedReserved("part-1", 2);
    await dataSource.query(
      "ALTER TABLE stock_release_operations ADD CONSTRAINT fail_stock_release_update CHECK (result_event_name IS NULL)",
    );
    await expect(
      releaseService.execute(command("event-rollback")),
    ).rejects.toThrow("fail_stock_release_update");
    const state = await persistedState("part-1");
    expect(state.part).toMatchObject({
      available_quantity: 10,
      reserved_quantity: 5,
    });
    expect(state.reservation).toMatchObject({
      status: StockReservationStatus.RESERVED,
      released_by_event_id: null,
      released_at: null,
    });
    expect(state.operation).toBeNull();
  });

  it("protects recovered consumed-message leases from an old worker", async () => {
    const ledger = consumedMessages();
    const oldClaim = await ledger.claim(
      "workshop-stock-release-requested",
      "ledger-event",
    );
    await dataSource.getRepository(ConsumedMessageOrmEntity).update(
      {
        consumerName: "workshop-stock-release-requested",
        eventId: "ledger-event",
      },
      { leaseExpiresAt: new Date("2000-01-01T00:00:00.000Z") },
    );
    const recovered = await ledger.claim(
      "workshop-stock-release-requested",
      "ledger-event",
    );
    await expect(
      ledger.markProcessed(
        "workshop-stock-release-requested",
        "ledger-event",
        oldClaim!.token,
      ),
    ).rejects.toThrow("claim was lost");
    await expect(
      ledger.markProcessed(
        "workshop-stock-release-requested",
        "ledger-event",
        recovered!.token,
      ),
    ).resolves.toBeUndefined();
  });

  async function seedReserved(partId: string, quantity: number): Promise<void> {
    await dataSource.getRepository(PartOrmEntity).insert({
      id: partId,
      code: partId.toUpperCase(),
      name: `Part ${partId}`,
      description: null,
      unit_price: 10,
      available_quantity: 10,
      reserved_quantity: 5,
      minimum_quantity: 0,
      unit: "UNIT",
      active: true,
    });
    await dataSource.getRepository(StockReservationOrmEntity).insert({
      id: `reservation-${partId}`,
      saga_id: "saga-1",
      order_id: "order-1",
      part_id: partId,
      quantity,
      status: StockReservationStatus.RESERVED,
      failure_code: null,
      failure_reason: null,
      released_by_event_id: null,
      released_at: null,
    });
  }

  async function persistedState(partId: string) {
    return {
      part: await dataSource.getRepository(PartOrmEntity).findOneBy({
        id: partId,
      }),
      reservation: await dataSource
        .getRepository(StockReservationOrmEntity)
        .findOneBy({ part_id: partId }),
      operation:
        (
          await dataSource
            .getRepository(StockReleaseOperationOrmEntity)
            .find({ order: { created_at: "DESC" }, take: 1 })
        )[0] ?? null,
    };
  }

  function consumedMessages(): TypeOrmConsumedMessageRepository {
    return new TypeOrmConsumedMessageRepository(
      dataSource.getRepository(ConsumedMessageOrmEntity),
      new ConfigService({ CONSUMED_MESSAGE_LEASE_MS: 60000 }),
    );
  }

  function stockHandler(publisher: { publish: jest.Mock }): StockEventsService {
    return new StockEventsService(
      { subscribe: jest.fn() },
      publisher,
      {} as never,
      releaseService,
      consumedMessages(),
      new ConfigService({ MESSAGING_ENABLED: false }),
    );
  }
});

function command(
  eventId: string,
  reservations = [{ partId: "part-1", quantity: 2 }],
) {
  return {
    commandEventId: eventId,
    sagaId: "saga-1",
    orderId: "order-1",
    correlationId: "correlation-1",
    reservations,
  };
}

function message(
  eventId: string,
  reservations = [{ partId: "part-1", quantity: 2 }],
) {
  return {
    eventId,
    eventName: "stock.release.requested",
    eventVersion: 1,
    occurredAt: "2026-07-26T10:00:00.000Z",
    correlationId: "correlation-1",
    causationId: "cause-1",
    sagaId: "saga-1",
    orderId: "order-1",
    payload: { reservations },
  };
}
