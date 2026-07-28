import { CreateServiceCatalogItemDto } from "../../src/service-catalog/application/dto/create-service-catalog-item.dto";
import { UpdateServiceCatalogItemDto } from "../../src/service-catalog/application/dto/update-service-catalog-item.dto";
import { ServiceCatalogItem } from "../../src/service-catalog/domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemOrmEntity } from "../../src/service-catalog/infrastructure/typeorm/service-catalog-item.orm-entity";

export function createServiceCatalogItem(
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    price: number;
    estimatedMinutes: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): ServiceCatalogItem {
  return ServiceCatalogItem.create({
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
    name: overrides.name ?? "Oil change",
    description: overrides.description ?? "Complete oil and filter replacement",
    price: overrides.price ?? 150,
    estimatedMinutes: overrides.estimatedMinutes ?? 90,
    active: overrides.active,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-02T00:00:00.000Z"),
  });
}

export function createServiceCatalogItemDto(
  overrides: Partial<CreateServiceCatalogItemDto> = {},
): CreateServiceCatalogItemDto {
  return {
    name: "Oil change",
    description: "Complete oil and filter replacement",
    price: 150,
    estimatedMinutes: 90,
    ...overrides,
  };
}

export function updateServiceCatalogItemDto(
  overrides: Partial<UpdateServiceCatalogItemDto> = {},
): UpdateServiceCatalogItemDto {
  return {
    name: "Wheel alignment",
    description: "Wheel alignment service",
    price: 200,
    estimatedMinutes: 60,
    ...overrides,
  };
}

export function createServiceCatalogItemOrmEntity(
  overrides: Partial<ServiceCatalogItemOrmEntity> = {},
): ServiceCatalogItemOrmEntity {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Oil change",
    description: "Complete oil and filter replacement",
    price: 150,
    estimated_minutes: 90,
    active: true,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-02T00:00:00.000Z"),
    ...overrides,
  } as ServiceCatalogItemOrmEntity;
}
