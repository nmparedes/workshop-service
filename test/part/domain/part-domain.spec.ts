import { DomainException } from "../../../src/common/exceptions/domain.exception";
import { InsufficientReservedStockException } from "../../../src/part/domain/exceptions/insufficient-reserved-stock.exception";
import { InsufficientStockException } from "../../../src/part/domain/exceptions/insufficient-stock.exception";
import { QuantityInvalidException } from "../../../src/part/domain/exceptions/quantity-invalid.exception";
import { createPart } from "../part.factory";

describe("Part", () => {
  it("creates a valid part and exposes derived stock fields", () => {
    const part = createPart({
      availableQuantity: 5,
      reservedQuantity: 2,
      minimumQuantity: 10,
    });

    expect(part.code.rawValue).toBe("OIL-123");
    expect(part.totalQuantity).toBe(7);
    expect(part.belowMinimumStock).toBe(true);
    expect(part.hasAvailableStock).toBe(true);
    expect(part.active).toBe(true);
  });

  it("validates name, description, price, quantities and unit", () => {
    expect(() => createPart({ name: "" })).toThrow(DomainException);
    expect(() => createPart({ name: "AB" })).toThrow(DomainException);
    expect(() => createPart({ name: "A".repeat(101) })).toThrow(
      DomainException,
    );
    expect(() => createPart({ description: "A".repeat(501) })).toThrow(
      DomainException,
    );
    expect(() => createPart({ unitPrice: 0 })).toThrow(DomainException);
    expect(() => createPart({ availableQuantity: -1 })).toThrow(
      QuantityInvalidException,
    );
    expect(() => createPart({ reservedQuantity: -1 })).toThrow(
      QuantityInvalidException,
    );
    expect(() => createPart({ minimumQuantity: -1 })).toThrow(
      QuantityInvalidException,
    );
    expect(() => createPart({ unit: "" })).toThrow(DomainException);
  });

  it("updates mutable fields and supports soft deletion", () => {
    const part = createPart();

    part.update({
      name: "Brake pad",
      description: "Ceramic brake pad",
      unitPrice: 120,
      minimumQuantity: 4,
      unit: "PAR",
    });
    part.deactivate();
    part.activate();

    expect(part.name).toBe("Brake pad");
    expect(part.description).toBe("Ceramic brake pad");
    expect(part.unitPrice).toBe(120);
    expect(part.minimumQuantity).toBe(4);
    expect(part.unit).toBe("PAR");
    expect(part.active).toBe(true);
  });

  it("applies stock movements and rejects invalid movements", () => {
    const part = createPart({ availableQuantity: 10, reservedQuantity: 2 });

    part.addStock(5);
    part.removeStock(3);
    part.reserveStock(4);
    part.releaseStock(2);
    part.commitReservedStock(3);

    expect(part.availableQuantity).toBe(10);
    expect(part.reservedQuantity).toBe(1);
    expect(() => part.addStock(0)).toThrow(QuantityInvalidException);
    expect(() => part.removeStock(999)).toThrow(InsufficientStockException);
    expect(() => part.releaseStock(999)).toThrow(
      InsufficientReservedStockException,
    );
    expect(() => part.commitReservedStock(999)).toThrow(
      InsufficientReservedStockException,
    );
  });
});
