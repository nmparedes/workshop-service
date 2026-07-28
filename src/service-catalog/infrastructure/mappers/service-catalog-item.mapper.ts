import { ServiceCatalogItem } from "../../domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemOrmEntity } from "../typeorm/service-catalog-item.orm-entity";

export class ServiceCatalogItemMapper {
  static toDomain(ormEntity: ServiceCatalogItemOrmEntity): ServiceCatalogItem {
    return ServiceCatalogItem.create({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description ?? undefined,
      price:
        typeof ormEntity.price === "string"
          ? Number(ormEntity.price)
          : ormEntity.price,
      estimatedMinutes: ormEntity.estimated_minutes,
      active: ormEntity.active,
      createdAt: ormEntity.created_at,
      updatedAt: ormEntity.updated_at,
    });
  }

  static toOrmEntity(item: ServiceCatalogItem): ServiceCatalogItemOrmEntity {
    const ormEntity = new ServiceCatalogItemOrmEntity();

    ormEntity.id = item.id;
    ormEntity.name = item.name;
    ormEntity.description = item.description || null;
    ormEntity.price = item.price;
    ormEntity.estimated_minutes = item.estimatedMinutes;
    ormEntity.active = item.active;
    ormEntity.created_at = item.createdAt;
    ormEntity.updated_at = item.updatedAt;

    return ormEntity;
  }

  static toDomainList(
    ormEntities: ServiceCatalogItemOrmEntity[],
  ): ServiceCatalogItem[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }
}
