import { Part } from "../entities/part.entity";
import { PartFilters } from "./part-filters.interface";

export interface PartRepository {
  save(part: Part): Promise<Part>;
  findById(id: string): Promise<Part | null>;
  findByCode(code: string): Promise<Part | null>;
  findAll(filters?: PartFilters): Promise<Part[]>;
  findBelowMinimumStock(): Promise<Part[]>;
  delete(id: string): Promise<void>;
}
