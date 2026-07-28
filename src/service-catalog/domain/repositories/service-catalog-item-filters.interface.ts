export interface ServiceCatalogItemFilters {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  minEstimatedMinutes?: number;
  maxEstimatedMinutes?: number;
  active?: boolean;
  page?: number;
  limit?: number;
  orderBy?: "name" | "price" | "estimatedMinutes" | "createdAt";
  order?: "ASC" | "DESC";
}
