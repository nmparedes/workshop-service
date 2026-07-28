import { Part } from "../../domain/entities/part.entity";
import { PartOrmEntity } from "../typeorm/part.orm-entity";

export class PartMapper {
  static toDomain(ormEntity: PartOrmEntity): Part {
    return Part.create({
      id: ormEntity.id,
      code: ormEntity.code,
      name: ormEntity.name,
      description: ormEntity.description ?? undefined,
      unitPrice:
        typeof ormEntity.unit_price === "string"
          ? Number(ormEntity.unit_price)
          : ormEntity.unit_price,
      availableQuantity: ormEntity.available_quantity,
      reservedQuantity: ormEntity.reserved_quantity,
      minimumQuantity: ormEntity.minimum_quantity,
      unit: ormEntity.unit,
      active: ormEntity.active,
      createdAt: ormEntity.created_at,
      updatedAt: ormEntity.updated_at,
    });
  }

  static toOrmEntity(part: Part): PartOrmEntity {
    const ormEntity = new PartOrmEntity();

    ormEntity.id = part.id;
    ormEntity.code = part.code.rawValue;
    ormEntity.name = part.name;
    ormEntity.description = part.description || null;
    ormEntity.unit_price = part.unitPrice;
    ormEntity.available_quantity = part.availableQuantity;
    ormEntity.reserved_quantity = part.reservedQuantity;
    ormEntity.minimum_quantity = part.minimumQuantity;
    ormEntity.unit = part.unit;
    ormEntity.active = part.active;
    ormEntity.created_at = part.createdAt;
    ormEntity.updated_at = part.updatedAt;

    return ormEntity;
  }

  static toDomainList(ormEntities: PartOrmEntity[]): Part[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }
}
