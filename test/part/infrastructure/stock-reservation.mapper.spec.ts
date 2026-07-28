import { StockReservation } from "../../../src/part/domain/entities/stock-reservation.entity";
import { StockReservationStatus } from "../../../src/part/domain/enums/stock-reservation-status.enum";
import { StockReservationMapper } from "../../../src/part/infrastructure/mappers/stock-reservation.mapper";
import {
  createStockReservation,
  createStockReservationOrmEntity,
} from "../part.factory";

describe("StockReservationMapper", () => {
  it("maps ORM entities to domain reservations", () => {
    const reservation = StockReservationMapper.toDomain(
      createStockReservationOrmEntity({
        status: StockReservationStatus.FAILED,
        failure_code: "PART_NOT_FOUND",
        failure_reason: "Part was not found.",
        released_by_event_id: null,
        released_at: null,
      }),
    );

    expect(reservation).toBeInstanceOf(StockReservation);
    expect(reservation.status).toBe(StockReservationStatus.FAILED);
    expect(reservation.failureCode).toBe("PART_NOT_FOUND");
  });

  it("maps domain reservations to ORM entities", () => {
    const reservation = createStockReservation({
      status: StockReservationStatus.COMMITTED,
    });
    const ormEntity = StockReservationMapper.toOrmEntity(reservation);

    expect(ormEntity).toMatchObject({
      id: reservation.id,
      saga_id: reservation.sagaId,
      order_id: reservation.orderId,
      part_id: reservation.partId,
      quantity: reservation.quantity,
      status: StockReservationStatus.COMMITTED,
    });
  });

  it("preserves release audit fields in both directions", () => {
    const releasedAt = new Date("2026-07-26T12:00:00.000Z");
    const domain = StockReservationMapper.toDomain(
      createStockReservationOrmEntity({
        status: StockReservationStatus.RELEASED,
        released_by_event_id: "release-event-1",
        released_at: releasedAt,
      }),
    );
    expect(domain.releasedByEventId).toBe("release-event-1");
    expect(domain.releasedAt).toEqual(releasedAt);
    expect(StockReservationMapper.toOrmEntity(domain)).toMatchObject({
      released_by_event_id: "release-event-1",
      released_at: releasedAt,
    });
  });
});
