import { Execution } from "../entities/execution.entity";
import { ExecutionStatus } from "../enums/execution-status.enum";

export interface ExecutionFilters {
  status?: ExecutionStatus;
}

export interface ExecutionRepository {
  save(execution: Execution): Promise<Execution>;
  findById(id: string): Promise<Execution | null>;
  findBySagaId(sagaId: string): Promise<Execution | null>;
  findByOrderId(orderId: string): Promise<Execution | null>;
  findAll(filters?: ExecutionFilters): Promise<Execution[]>;
}
