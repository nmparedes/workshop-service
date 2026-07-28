import { getRepositoryToken } from "@nestjs/typeorm";
import { Test } from "@nestjs/testing";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Part } from "../../../src/part/domain/entities/part.entity";
import { PartMapper } from "../../../src/part/infrastructure/mappers/part.mapper";
import { TypeOrmPartRepository } from "../../../src/part/infrastructure/repositories/typeorm-part.repository";
import { PartOrmEntity } from "../../../src/part/infrastructure/typeorm/part.orm-entity";
import { createPart } from "../part.factory";

describe("TypeOrmPartRepository", () => {
  let repository: TypeOrmPartRepository;
  let ormRepository: jest.Mocked<Repository<PartOrmEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<PartOrmEntity>>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<PartOrmEntity>>;

    ormRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<PartOrmEntity>>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        TypeOrmPartRepository,
        {
          provide: getRepositoryToken(PartOrmEntity),
          useValue: ormRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get(TypeOrmPartRepository);
  });

  it("saves parts", async () => {
    const part = createPart();
    ormRepository.save.mockResolvedValue(PartMapper.toOrmEntity(part));

    const result = await repository.save(part);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: part.id, code: part.code.rawValue }),
    );
    expect(result).toBeInstanceOf(Part);
  });

  it("finds active parts by id and normalized code", async () => {
    const part = createPart();
    const ormEntity = PartMapper.toOrmEntity(part);
    ormRepository.findOne.mockResolvedValue(ormEntity);

    await expect(repository.findById(part.id)).resolves.toBeInstanceOf(Part);
    await expect(repository.findByCode(" oil-123 ")).resolves.toBeInstanceOf(
      Part,
    );
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { id: part.id, active: true },
    });
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { code: "OIL-123", active: true },
    });
  });

  it("returns null for missing parts", async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById("missing")).resolves.toBeNull();
    await expect(repository.findByCode("missing")).resolves.toBeNull();
  });

  it("applies filters, ordering and pagination", async () => {
    queryBuilder.getMany.mockResolvedValue([
      PartMapper.toOrmEntity(createPart()),
    ]);

    const result = await repository.findAll({
      code: "OIL",
      name: "engine",
      minPrice: 10,
      maxPrice: 100,
      unit: "L",
      onlyBelowMinimumStock: true,
      onlyWithStock: true,
      active: true,
      orderBy: "name",
      order: "ASC",
      page: 2,
      limit: 10,
    });

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith("part");
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "part.active = :active",
      { active: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "UPPER(part.code) LIKE UPPER(:code)",
      { code: "%OIL%" },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "LOWER(part.name) LIKE LOWER(:name)",
      { name: "%engine%" },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "part.unit_price >= :minPrice",
      { minPrice: 10 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "part.unit_price <= :maxPrice",
      { maxPrice: 100 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith("part.unit = :unit", {
      unit: "L",
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "part.available_quantity < part.minimum_quantity",
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "part.available_quantity > 0",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith("part.name", "ASC");
    expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    expect(queryBuilder.offset).toHaveBeenCalledWith(10);
    expect(result).toHaveLength(1);
  });

  it("supports each order field, below-minimum search and soft delete", async () => {
    queryBuilder.getMany.mockResolvedValue([]);
    ormRepository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });

    await repository.findAll({ orderBy: "code" });
    await repository.findAll({ orderBy: "unitPrice" });
    await repository.findAll({ orderBy: "availableQuantity" });
    await repository.findAll();
    await repository.findBelowMinimumStock();
    await repository.delete("part-1");

    expect(queryBuilder.orderBy).toHaveBeenCalledWith("part.code", "DESC");
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "part.unit_price",
      "DESC",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "part.available_quantity",
      "DESC",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "part.created_at",
      "DESC",
    );
    expect(ormRepository.update).toHaveBeenCalledWith("part-1", {
      active: false,
    });
  });
});
