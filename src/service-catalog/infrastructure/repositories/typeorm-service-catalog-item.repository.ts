import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceCatalogItem } from "../../domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemFilters } from "../../domain/repositories/service-catalog-item-filters.interface";
import { ServiceCatalogItemRepository } from "../../domain/repositories/service-catalog-item.repository.interface";
import { ServiceCatalogItemMapper } from "../mappers/service-catalog-item.mapper";
import { ServiceCatalogItemOrmEntity } from "../typeorm/service-catalog-item.orm-entity";

@Injectable()
export class TypeOrmServiceCatalogItemRepository implements ServiceCatalogItemRepository {
  constructor(
    @InjectRepository(ServiceCatalogItemOrmEntity)
    private readonly repository: Repository<ServiceCatalogItemOrmEntity>,
  ) {}

  async save(item: ServiceCatalogItem): Promise<ServiceCatalogItem> {
    const savedEntity = await this.repository.save(
      ServiceCatalogItemMapper.toOrmEntity(item),
    );
    return ServiceCatalogItemMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<ServiceCatalogItem | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ServiceCatalogItemMapper.toDomain(ormEntity) : null;
  }

  async findByName(name: string): Promise<ServiceCatalogItem | null> {
    const ormEntity = await this.repository.findOne({
      where: { name: name.trim() },
    });
    return ormEntity ? ServiceCatalogItemMapper.toDomain(ormEntity) : null;
  }

  async findAll(
    filters?: ServiceCatalogItemFilters,
  ): Promise<ServiceCatalogItem[]> {
    const queryBuilder =
      this.repository.createQueryBuilder("serviceCatalogItem");

    if (filters?.name) {
      queryBuilder.andWhere(
        "LOWER(serviceCatalogItem.name) LIKE LOWER(:name)",
        { name: `%${filters.name}%` },
      );
    }

    if (filters?.minPrice !== undefined) {
      queryBuilder.andWhere("serviceCatalogItem.price >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice !== undefined) {
      queryBuilder.andWhere("serviceCatalogItem.price <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.minEstimatedMinutes !== undefined) {
      queryBuilder.andWhere(
        "serviceCatalogItem.estimated_minutes >= :minEstimatedMinutes",
        { minEstimatedMinutes: filters.minEstimatedMinutes },
      );
    }

    if (filters?.maxEstimatedMinutes !== undefined) {
      queryBuilder.andWhere(
        "serviceCatalogItem.estimated_minutes <= :maxEstimatedMinutes",
        { maxEstimatedMinutes: filters.maxEstimatedMinutes },
      );
    }

    if (filters?.active !== undefined) {
      queryBuilder.andWhere("serviceCatalogItem.active = :active", {
        active: filters.active,
      });
    }

    queryBuilder.orderBy(
      this.toOrderByColumn(filters?.orderBy),
      filters?.order ?? "DESC",
    );

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.page && filters?.limit) {
      queryBuilder.offset((filters.page - 1) * filters.limit);
    }

    return ServiceCatalogItemMapper.toDomainList(await queryBuilder.getMany());
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { active: false });
  }

  private toOrderByColumn(
    orderBy: ServiceCatalogItemFilters["orderBy"],
  ): string {
    if (orderBy === "name") {
      return "serviceCatalogItem.name";
    }
    if (orderBy === "price") {
      return "serviceCatalogItem.price";
    }
    if (orderBy === "estimatedMinutes") {
      return "serviceCatalogItem.estimated_minutes";
    }
    return "serviceCatalogItem.created_at";
  }
}
