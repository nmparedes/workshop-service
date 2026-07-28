export interface PartFilters {
  code?: string;
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  onlyBelowMinimumStock?: boolean;
  onlyWithStock?: boolean;
  active?: boolean;
  page?: number;
  limit?: number;
  orderBy?: "code" | "name" | "unitPrice" | "availableQuantity" | "createdAt";
  order?: "ASC" | "DESC";
}
