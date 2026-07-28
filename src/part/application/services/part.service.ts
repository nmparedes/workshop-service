import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResponse } from "../../../common/interfaces/paginated-response.interface";
import { PART_REPOSITORY } from "../../part.tokens";
import { Part } from "../../domain/entities/part.entity";
import { PartAlreadyExistsException } from "../../domain/exceptions/part-already-exists.exception";
import { PartNotFoundException } from "../../domain/exceptions/part-not-found.exception";
import { PartFilters } from "../../domain/repositories/part-filters.interface";
import type { PartRepository } from "../../domain/repositories/part.repository.interface";
import { CreatePartDto } from "../dto/create-part.dto";
import { PartResponseDto } from "../dto/part-response.dto";
import { StockMovementDto } from "../dto/stock-movement.dto";
import { UpdatePartDto } from "../dto/update-part.dto";

@Injectable()
export class PartService {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly partRepository: PartRepository,
  ) {}

  async create(dto: CreatePartDto): Promise<PartResponseDto> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existingPart = await this.partRepository.findByCode(normalizedCode);
    if (existingPart) {
      throw new PartAlreadyExistsException(normalizedCode);
    }

    const part = Part.create({
      code: normalizedCode,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      unitPrice: dto.unitPrice,
      availableQuantity: dto.availableQuantity,
      minimumQuantity: dto.minimumQuantity,
      unit: dto.unit.toUpperCase(),
    });

    return this.toResponseDto(await this.partRepository.save(part));
  }

  async findById(id: string): Promise<PartResponseDto> {
    const part = await this.partRepository.findById(id);
    if (!part) {
      throw new PartNotFoundException(id);
    }

    return this.toResponseDto(part);
  }

  async findByCode(code: string): Promise<PartResponseDto> {
    const part = await this.partRepository.findByCode(code);
    if (!part) {
      throw new PartNotFoundException(code);
    }

    return this.toResponseDto(part);
  }

  async findAll(
    filters: PartFilters,
  ): Promise<PaginatedResponse<PartResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const normalizedFilters = {
      ...filters,
      code: filters.code?.trim().toUpperCase(),
      unit: filters.unit?.toUpperCase(),
      page,
      limit,
    };
    const parts = await this.partRepository.findAll(normalizedFilters);
    const allParts = await this.partRepository.findAll({
      code: filters.code?.trim().toUpperCase(),
      name: filters.name,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      unit: filters.unit?.toUpperCase(),
      onlyBelowMinimumStock: filters.onlyBelowMinimumStock,
      onlyWithStock: filters.onlyWithStock,
      active: filters.active,
    });

    return {
      data: parts.map((part) => this.toResponseDto(part)),
      meta: {
        total: allParts.length,
        page,
        limit,
        totalPages: Math.ceil(allParts.length / limit),
      },
    };
  }

  async findBelowMinimumStock(): Promise<PartResponseDto[]> {
    const parts = await this.partRepository.findBelowMinimumStock();
    return parts.map((part) => this.toResponseDto(part));
  }

  async update(id: string, dto: UpdatePartDto): Promise<PartResponseDto> {
    const part = await this.partRepository.findById(id);
    if (!part) {
      throw new PartNotFoundException(id);
    }

    part.update({
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      unitPrice: dto.unitPrice,
      minimumQuantity: dto.minimumQuantity,
      unit: dto.unit?.toUpperCase(),
    });

    return this.toResponseDto(await this.partRepository.save(part));
  }

  async delete(id: string): Promise<void> {
    const part = await this.partRepository.findById(id);
    if (!part) {
      throw new PartNotFoundException(id);
    }

    part.deactivate();
    await this.partRepository.save(part);
  }

  async addStock(id: string, dto: StockMovementDto): Promise<PartResponseDto> {
    return this.applyStockMovement(id, dto, (part) =>
      part.addStock(dto.quantity),
    );
  }

  async removeStock(
    id: string,
    dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.applyStockMovement(id, dto, (part) =>
      part.removeStock(dto.quantity),
    );
  }

  async reserveStock(
    id: string,
    dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.applyStockMovement(id, dto, (part) =>
      part.reserveStock(dto.quantity),
    );
  }

  async releaseStock(
    id: string,
    dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.applyStockMovement(id, dto, (part) =>
      part.releaseStock(dto.quantity),
    );
  }

  async commitReservedStock(
    id: string,
    dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.applyStockMovement(id, dto, (part) =>
      part.commitReservedStock(dto.quantity),
    );
  }

  private async applyStockMovement(
    id: string,
    dto: StockMovementDto,
    apply: (part: Part) => void,
  ): Promise<PartResponseDto> {
    const part = await this.partRepository.findById(id);
    if (!part) {
      throw new PartNotFoundException(id);
    }

    apply(part);
    return this.toResponseDto(await this.partRepository.save(part));
  }

  private toResponseDto(part: Part): PartResponseDto {
    return {
      id: part.id,
      code: part.code.rawValue,
      name: part.name,
      description: part.description,
      unitPrice: part.unitPrice,
      formattedUnitPrice: this.formatPrice(part.unitPrice),
      availableQuantity: part.availableQuantity,
      reservedQuantity: part.reservedQuantity,
      totalQuantity: part.totalQuantity,
      minimumQuantity: part.minimumQuantity,
      belowMinimumStock: part.belowMinimumStock,
      hasAvailableStock: part.hasAvailableStock,
      unit: part.unit,
      active: part.active,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  }
}
