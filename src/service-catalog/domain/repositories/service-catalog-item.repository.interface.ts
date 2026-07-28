import { ServiceCatalogItem } from "../entities/service-catalog-item.entity";
import { ServiceCatalogItemFilters } from "./service-catalog-item-filters.interface";

export interface ServiceCatalogItemRepository {
  save(item: ServiceCatalogItem): Promise<ServiceCatalogItem>;
  findById(id: string): Promise<ServiceCatalogItem | null>;
  findByName(name: string): Promise<ServiceCatalogItem | null>;
  findAll(filters?: ServiceCatalogItemFilters): Promise<ServiceCatalogItem[]>;
  delete(id: string): Promise<void>;
}
