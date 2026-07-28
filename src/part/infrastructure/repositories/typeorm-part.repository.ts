import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Part } from "../../domain/entities/part.entity";
import { PartFilters } from "../../domain/repositories/part-filters.interface";
import { PartRepository } from "../../domain/repositories/part.repository.interface";
import { PartMapper } from "../mappers/part.mapper";
import { PartOrmEntity } from "../typeorm/part.orm-entity";

@Injectable()
export class TypeOrmPartRepository implements PartRepository {
  constructor(
    @InjectRepository(PartOrmEntity)
    private readonly repository: Repository<PartOrmEntity>,
  ) {}

  async save(part: Part): Promise<Part> {
    const savedEntity = await this.repository.save(
      PartMapper.toOrmEntity(part),
    );
    return PartMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Part | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, active: true },
    });
    return ormEntity ? PartMapper.toDomain(ormEntity) : null;
  }

  async findByCode(code: string): Promise<Part | null> {
    const ormEntity = await this.repository.findOne({
      where: { code: code.trim().toUpperCase(), active: true },
    });
    return ormEntity ? PartMapper.toDomain(ormEntity) : null;
  }

  async findAll(filters?: PartFilters): Promise<Part[]> {
    const queryBuilder = this.repository.createQueryBuilder("part");

    queryBuilder.andWhere("part.active = :active", {
      active: filters?.active ?? true,
    });

    if (filters?.code) {
      queryBuilder.andWhere("UPPER(part.code) LIKE UPPER(:code)", {
        code: `%${filters.code}%`,
      });
    }

    if (filters?.name) {
      queryBuilder.andWhere("LOWER(part.name) LIKE LOWER(:name)", {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.minPrice !== undefined) {
      queryBuilder.andWhere("part.unit_price >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice !== undefined) {
      queryBuilder.andWhere("part.unit_price <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.unit) {
      queryBuilder.andWhere("part.unit = :unit", {
        unit: filters.unit.toUpperCase(),
      });
    }

    if (filters?.onlyBelowMinimumStock) {
      queryBuilder.andWhere("part.available_quantity < part.minimum_quantity");
    }

    if (filters?.onlyWithStock) {
      queryBuilder.andWhere("part.available_quantity > 0");
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

    return PartMapper.toDomainList(await queryBuilder.getMany());
  }

  async findBelowMinimumStock(): Promise<Part[]> {
    const queryBuilder = this.repository.createQueryBuilder("part");
    queryBuilder
      .andWhere("part.available_quantity < part.minimum_quantity")
      .andWhere("part.active = :active", { active: true });

    return PartMapper.toDomainList(await queryBuilder.getMany());
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { active: false });
  }

  private toOrderByColumn(orderBy: PartFilters["orderBy"]): string {
    if (orderBy === "code") {
      return "part.code";
    }
    if (orderBy === "name") {
      return "part.name";
    }
    if (orderBy === "unitPrice") {
      return "part.unit_price";
    }
    if (orderBy === "availableQuantity") {
      return "part.available_quantity";
    }
    return "part.created_at";
  }
}
