import { getRepositoryToken } from "@nestjs/typeorm";
import { Test } from "@nestjs/testing";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ServiceCatalogItem } from "../../../src/service-catalog/domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemMapper } from "../../../src/service-catalog/infrastructure/mappers/service-catalog-item.mapper";
import { TypeOrmServiceCatalogItemRepository } from "../../../src/service-catalog/infrastructure/repositories/typeorm-service-catalog-item.repository";
import { ServiceCatalogItemOrmEntity } from "../../../src/service-catalog/infrastructure/typeorm/service-catalog-item.orm-entity";
import { createServiceCatalogItem } from "../service-catalog.factory";

describe("TypeOrmServiceCatalogItemRepository", () => {
  let repository: TypeOrmServiceCatalogItemRepository;
  let ormRepository: jest.Mocked<Repository<ServiceCatalogItemOrmEntity>>;
  let queryBuilder: jest.Mocked<
    SelectQueryBuilder<ServiceCatalogItemOrmEntity>
  >;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as jest.Mocked<
      SelectQueryBuilder<ServiceCatalogItemOrmEntity>
    >;

    ormRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<ServiceCatalogItemOrmEntity>>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        TypeOrmServiceCatalogItemRepository,
        {
          provide: getRepositoryToken(ServiceCatalogItemOrmEntity),
          useValue: ormRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get(TypeOrmServiceCatalogItemRepository);
  });

  it("saves service catalog items", async () => {
    const item = createServiceCatalogItem();
    ormRepository.save.mockResolvedValue(
      ServiceCatalogItemMapper.toOrmEntity(item),
    );

    const result = await repository.save(item);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: item.id, name: item.name }),
    );
    expect(result).toBeInstanceOf(ServiceCatalogItem);
  });

  it("finds items by id and name", async () => {
    const item = createServiceCatalogItem();
    const ormEntity = ServiceCatalogItemMapper.toOrmEntity(item);
    ormRepository.findOne.mockResolvedValue(ormEntity);

    await expect(repository.findById(item.id)).resolves.toBeInstanceOf(
      ServiceCatalogItem,
    );
    await expect(repository.findByName(item.name)).resolves.toBeInstanceOf(
      ServiceCatalogItem,
    );
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { id: item.id },
    });
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { name: item.name },
    });
  });

  it("returns null for missing items", async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById("missing")).resolves.toBeNull();
    await expect(repository.findByName("missing")).resolves.toBeNull();
  });

  it("applies filters, ordering and pagination", async () => {
    const item = createServiceCatalogItem();
    queryBuilder.getMany.mockResolvedValue([
      ServiceCatalogItemMapper.toOrmEntity(item),
    ]);

    const result = await repository.findAll({
      name: "oil",
      minPrice: 50,
      maxPrice: 200,
      minEstimatedMinutes: 30,
      maxEstimatedMinutes: 120,
      active: true,
      orderBy: "name",
      order: "ASC",
      page: 2,
      limit: 10,
    });

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith(
      "serviceCatalogItem",
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "LOWER(serviceCatalogItem.name) LIKE LOWER(:name)",
      { name: "%oil%" },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "serviceCatalogItem.price >= :minPrice",
      { minPrice: 50 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "serviceCatalogItem.price <= :maxPrice",
      { maxPrice: 200 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "serviceCatalogItem.estimated_minutes >= :minEstimatedMinutes",
      { minEstimatedMinutes: 30 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "serviceCatalogItem.estimated_minutes <= :maxEstimatedMinutes",
      { maxEstimatedMinutes: 120 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "serviceCatalogItem.active = :active",
      { active: true },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "serviceCatalogItem.name",
      "ASC",
    );
    expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    expect(queryBuilder.offset).toHaveBeenCalledWith(10);
    expect(result).toHaveLength(1);
  });

  it("supports each order field and soft deletes items", async () => {
    queryBuilder.getMany.mockResolvedValue([]);
    ormRepository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });

    await repository.findAll({ orderBy: "price" });
    await repository.findAll({ orderBy: "estimatedMinutes" });
    await repository.findAll();
    await repository.delete("item-1");

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "serviceCatalogItem.price",
      "DESC",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "serviceCatalogItem.estimated_minutes",
      "DESC",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "serviceCatalogItem.created_at",
      "DESC",
    );
    expect(ormRepository.update).toHaveBeenCalledWith("item-1", {
      active: false,
    });
  });
});
