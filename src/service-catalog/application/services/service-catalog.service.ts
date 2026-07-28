import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResponse } from "../../../common/interfaces/paginated-response.interface";
import { SERVICE_CATALOG_ITEM_REPOSITORY } from "../../service-catalog.tokens";
import { ServiceCatalogItem } from "../../domain/entities/service-catalog-item.entity";
import { ServiceCatalogItemAlreadyExistsException } from "../../domain/exceptions/service-catalog-item-already-exists.exception";
import { ServiceCatalogItemNotFoundException } from "../../domain/exceptions/service-catalog-item-not-found.exception";
import { ServiceCatalogItemFilters } from "../../domain/repositories/service-catalog-item-filters.interface";
import type { ServiceCatalogItemRepository } from "../../domain/repositories/service-catalog-item.repository.interface";
import { CreateServiceCatalogItemDto } from "../dto/create-service-catalog-item.dto";
import { ServiceCatalogItemResponseDto } from "../dto/service-catalog-item-response.dto";
import { UpdateServiceCatalogItemDto } from "../dto/update-service-catalog-item.dto";

@Injectable()
export class ServiceCatalogService {
  constructor(
    @Inject(SERVICE_CATALOG_ITEM_REPOSITORY)
    private readonly itemRepository: ServiceCatalogItemRepository,
  ) {}

  async create(
    dto: CreateServiceCatalogItemDto,
  ): Promise<ServiceCatalogItemResponseDto> {
    const trimmedName = dto.name.trim();
    const existingItem = await this.itemRepository.findByName(trimmedName);
    if (existingItem) {
      throw new ServiceCatalogItemAlreadyExistsException(trimmedName);
    }

    const item = ServiceCatalogItem.create({
      name: trimmedName,
      description: dto.description?.trim(),
      price: dto.price,
      estimatedMinutes: dto.estimatedMinutes,
    });

    return this.toResponseDto(await this.itemRepository.save(item));
  }

  async findById(id: string): Promise<ServiceCatalogItemResponseDto> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ServiceCatalogItemNotFoundException(id);
    }

    return this.toResponseDto(item);
  }

  async findByName(name: string): Promise<ServiceCatalogItemResponseDto> {
    const item = await this.itemRepository.findByName(name.trim());
    if (!item) {
      throw new ServiceCatalogItemNotFoundException(name);
    }

    return this.toResponseDto(item);
  }

  async findAll(
    filters: ServiceCatalogItemFilters,
  ): Promise<PaginatedResponse<ServiceCatalogItemResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const normalizedFilters = {
      ...filters,
      page,
      limit,
    };
    const items = await this.itemRepository.findAll(normalizedFilters);
    const allItems = await this.itemRepository.findAll({
      name: filters.name,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minEstimatedMinutes: filters.minEstimatedMinutes,
      maxEstimatedMinutes: filters.maxEstimatedMinutes,
      active: filters.active,
    });

    return {
      data: items.map((item) => this.toResponseDto(item)),
      meta: {
        total: allItems.length,
        page,
        limit,
        totalPages: Math.ceil(allItems.length / limit),
      },
    };
  }

  async update(
    id: string,
    dto: UpdateServiceCatalogItemDto,
  ): Promise<ServiceCatalogItemResponseDto> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ServiceCatalogItemNotFoundException(id);
    }

    const trimmedName = dto.name?.trim();
    if (trimmedName && trimmedName !== item.name) {
      const existingItem = await this.itemRepository.findByName(trimmedName);
      if (existingItem) {
        throw new ServiceCatalogItemAlreadyExistsException(trimmedName);
      }
    }

    item.update({
      name: trimmedName,
      description: dto.description?.trim(),
      price: dto.price,
      estimatedMinutes: dto.estimatedMinutes,
    });

    return this.toResponseDto(await this.itemRepository.save(item));
  }

  async delete(id: string): Promise<void> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ServiceCatalogItemNotFoundException(id);
    }

    item.deactivate();
    await this.itemRepository.save(item);
  }

  private toResponseDto(
    item: ServiceCatalogItem,
  ): ServiceCatalogItemResponseDto {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      formattedPrice: this.formatPrice(item.price),
      estimatedMinutes: item.estimatedMinutes,
      formattedEstimatedTime: this.formatEstimatedTime(item.estimatedMinutes),
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  }

  private formatEstimatedTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
  }
}
