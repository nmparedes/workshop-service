import { Part } from "../../../src/part/domain/entities/part.entity";
import { PartMapper } from "../../../src/part/infrastructure/mappers/part.mapper";
import { createPart, createPartOrmEntity } from "../part.factory";

describe("PartMapper", () => {
  it("maps ORM entities to domain parts", () => {
    const domainPart = PartMapper.toDomain(
      createPartOrmEntity({ unit_price: "45.99", description: null }),
    );

    expect(domainPart).toBeInstanceOf(Part);
    expect(domainPart.code.rawValue).toBe("OIL-123");
    expect(domainPart.description).toBe("");
    expect(domainPart.unitPrice).toBe(45.99);
  });

  it("maps domain parts to ORM entities and lists", () => {
    const part = createPart();
    const ormEntity = PartMapper.toOrmEntity(part);
    const list = PartMapper.toDomainList([ormEntity]);

    expect(ormEntity).toMatchObject({
      id: part.id,
      code: "OIL-123",
      unit_price: 45.99,
      available_quantity: 20,
      reserved_quantity: 5,
      minimum_quantity: 10,
      unit: "L",
      active: true,
    });
    expect(list).toHaveLength(1);
    expect(list[0]).toBeInstanceOf(Part);
  });
});
