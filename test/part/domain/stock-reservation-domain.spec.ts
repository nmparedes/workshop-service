import { DomainException } from "../../../src/common/exceptions/domain.exception";
import { QuantityInvalidException } from "../../../src/part/domain/exceptions/quantity-invalid.exception";
import { StockReservationStatus } from "../../../src/part/domain/enums/stock-reservation-status.enum";
import { createStockReservation, reserveStockCommand } from "../part.factory";
import { StockReservation } from "../../../src/part/domain/entities/stock-reservation.entity";

describe("StockReservation", () => {
  it("creates reserved and failed reservations", () => {
    const reserved = StockReservation.createReserved(reserveStockCommand());
    const failed = StockReservation.createFailed({
      ...reserveStockCommand(),
      failureCode: "PART_NOT_FOUND",
      failureReason: "Part was not found.",
    });

    expect(reserved.status).toBe(StockReservationStatus.RESERVED);
    expect(reserved.matchesReservationRequest(3)).toBe(true);
    expect(failed.status).toBe(StockReservationStatus.FAILED);
    expect(failed.failureCode).toBe("PART_NOT_FOUND");
  });

  it("transitions reservation statuses", () => {
    const reservation = createStockReservation();
    const releasedAt = new Date("2026-07-26T12:00:00.000Z");

    reservation.release("release-event-1", releasedAt);
    expect(reservation.status).toBe(StockReservationStatus.RELEASED);
    expect(reservation.releasedByEventId).toBe("release-event-1");
    expect(reservation.releasedAt).toEqual(releasedAt);

    const committed = createStockReservation();
    committed.commit();
    expect(committed.status).toBe(StockReservationStatus.COMMITTED);

    committed.fail("PART_NOT_FOUND", "Part disappeared.");
    expect(committed.status).toBe(StockReservationStatus.FAILED);
    expect(committed.failureCode).toBe("PART_NOT_FOUND");
  });

  it("rejects an empty release event ID and protects the released date", () => {
    const reservation = createStockReservation();
    expect(() => reservation.release(" ")).toThrow(
      "releasedByEventId cannot be empty",
    );
    reservation.release("release-event-1");
    const exposed = reservation.releasedAt!;
    exposed.setUTCFullYear(2000);
    expect(reservation.releasedAt!.getUTCFullYear()).not.toBe(2000);
  });

  it("validates identifiers and quantity", () => {
    expect(() =>
      StockReservation.createReserved({ ...reserveStockCommand(), sagaId: "" }),
    ).toThrow(DomainException);
    expect(() =>
      StockReservation.createReserved({
        ...reserveStockCommand(),
        quantity: 0,
      }),
    ).toThrow(QuantityInvalidException);
  });
});
