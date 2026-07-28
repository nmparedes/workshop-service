import { ServiceCatalogItem } from "../../../src/service-catalog/domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemMapper } from "../../../src/service-catalog/infrastructure/mappers/service-catalog-item.mapper";
import { ServiceCatalogItemOrmEntity } from "../../../src/service-catalog/infrastructure/typeorm/service-catalog-item.orm-entity";
import {
  createServiceCatalogItem,
  createServiceCatalogItemOrmEntity,
} from "../service-catalog.factory";

describe("ServiceCatalogItemMapper", () => {
  it("maps ORM entities to domain entities", () => {
    const item = ServiceCatalogItemMapper.toDomain(
      createServiceCatalogItemOrmEntity(),
    );

    expect(item).toBeInstanceOf(ServiceCatalogItem);
    expect(item.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(item.name).toBe("Oil change");
    expect(item.description).toBe("Complete oil and filter replacement");
    expect(item.price).toBe(150);
    expect(item.estimatedMinutes).toBe(90);
  });

  it("maps string decimal prices and null descriptions", () => {
    const item = ServiceCatalogItemMapper.toDomain(
      createServiceCatalogItemOrmEntity({
        description: null,
        price: "299.99",
      }),
    );

    expect(item.description).toBe("");
    expect(item.price).toBe(299.99);
  });

  it("maps domain entities to ORM entities", () => {
    const item = createServiceCatalogItem();
    const mapped = ServiceCatalogItemMapper.toOrmEntity(item);

    expect(mapped).toBeInstanceOf(ServiceCatalogItemOrmEntity);
    expect(mapped.id).toBe(item.id);
    expect(mapped.name).toBe(item.name);
    expect(mapped.description).toBe(item.description);
    expect(mapped.price).toBe(item.price);
    expect(mapped.estimated_minutes).toBe(item.estimatedMinutes);
  });

  it("maps empty descriptions to null and maps lists", () => {
    const item = createServiceCatalogItem({ description: "" });
    const mapped = ServiceCatalogItemMapper.toOrmEntity(item);

    expect(mapped.description).toBeNull();
    expect(ServiceCatalogItemMapper.toDomainList([])).toEqual([]);
    expect(
      ServiceCatalogItemMapper.toDomainList([
        createServiceCatalogItemOrmEntity(),
      ]),
    ).toHaveLength(1);
  });
});
