import { DomainException } from "../../../src/common/exceptions/domain.exception";
import { ServiceCatalogItem } from "../../../src/service-catalog/domain/entities/service-catalog-item.entity";
import { EstimatedTimeInvalidException } from "../../../src/service-catalog/domain/exceptions/estimated-time-invalid.exception";
import { PriceInvalidException } from "../../../src/service-catalog/domain/exceptions/price-invalid.exception";
import { createServiceCatalogItem } from "../service-catalog.factory";

describe("ServiceCatalogItem", () => {
  it("creates, updates, activates and deactivates service catalog items", () => {
    const item = createServiceCatalogItem({ active: false });
    const originalCreatedAt = item.createdAt;

    item.activate();
    expect(item.active).toBe(true);

    item.update({
      name: "Wheel alignment",
      description: "Alignment and balancing",
      price: 200,
      estimatedMinutes: 60,
    });

    expect(item.name).toBe("Wheel alignment");
    expect(item.description).toBe("Alignment and balancing");
    expect(item.price).toBe(200);
    expect(item.estimatedMinutes).toBe(60);
    expect(item.createdAt).toBe(originalCreatedAt);

    item.deactivate();
    expect(item.active).toBe(false);
  });

  it("creates items with optional description and custom fields", () => {
    const createdAt = new Date("2024-03-01T00:00:00.000Z");
    const item = ServiceCatalogItem.create({
      id: "item-1",
      name: "ABC",
      price: 0.01,
      estimatedMinutes: 1,
      createdAt,
      updatedAt: createdAt,
    });

    expect(item.id).toBe("item-1");
    expect(item.description).toBe("");
    expect(item.price).toBe(0.01);
    expect(item.estimatedMinutes).toBe(1);
    expect(item.createdAt).toBe(createdAt);
  });

  it("rejects invalid names and descriptions", () => {
    expect(() => createServiceCatalogItem({ name: "" })).toThrow(
      DomainException,
    );
    expect(() => createServiceCatalogItem({ name: "AB" })).toThrow(
      DomainException,
    );
    expect(() => createServiceCatalogItem({ name: "A".repeat(101) })).toThrow(
      DomainException,
    );
    expect(() =>
      createServiceCatalogItem({ description: "A".repeat(501) }),
    ).toThrow(DomainException);
  });

  it("rejects invalid price and estimated time", () => {
    expect(() => createServiceCatalogItem({ price: 0 })).toThrow(
      PriceInvalidException,
    );
    expect(() => createServiceCatalogItem({ price: -10 })).toThrow(
      PriceInvalidException,
    );
    expect(() => createServiceCatalogItem({ price: 0.001 })).toThrow(
      PriceInvalidException,
    );
    expect(() => createServiceCatalogItem({ estimatedMinutes: 0 })).toThrow(
      EstimatedTimeInvalidException,
    );
    expect(() => createServiceCatalogItem({ estimatedMinutes: -1 })).toThrow(
      EstimatedTimeInvalidException,
    );
  });

  it("validates update values and discount calculation", () => {
    const item = createServiceCatalogItem({ price: 100 });

    expect(item.calculateDiscountedPrice(15)).toBe(85);
    expect(() => item.calculateDiscountedPrice(-1)).toThrow(DomainException);
    expect(() => item.calculateDiscountedPrice(101)).toThrow(DomainException);
    expect(() => item.update({ name: "AB" })).toThrow(DomainException);
    expect(() => item.update({ description: "A".repeat(501) })).toThrow(
      DomainException,
    );
    expect(() => item.update({ price: 0 })).toThrow(PriceInvalidException);
    expect(() => item.update({ estimatedMinutes: 0 })).toThrow(
      EstimatedTimeInvalidException,
    );
  });
});
