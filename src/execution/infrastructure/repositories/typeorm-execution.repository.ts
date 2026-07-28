import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Execution } from "../../domain/entities/execution.entity";
import {
  type ExecutionFilters,
  type ExecutionRepository,
} from "../../domain/repositories/execution.repository.interface";
import { ExecutionStatus } from "../../domain/enums/execution-status.enum";
import { ExecutionMapper } from "../mappers/execution.mapper";
import { ExecutionOrmEntity } from "../typeorm/execution.orm-entity";

@Injectable()
export class TypeOrmExecutionRepository implements ExecutionRepository {
  constructor(
    @InjectRepository(ExecutionOrmEntity)
    private readonly repository: Repository<ExecutionOrmEntity>,
  ) {}

  async save(execution: Execution): Promise<Execution> {
    const saved = await this.repository.save(
      ExecutionMapper.toOrmEntity(execution),
    );
    return ExecutionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Execution | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ExecutionMapper.toDomain(entity) : null;
  }

  async findBySagaId(sagaId: string): Promise<Execution | null> {
    const entity = await this.repository.findOne({
      where: { saga_id: sagaId },
    });
    return entity ? ExecutionMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Execution | null> {
    const entity = await this.repository.findOne({
      where: { order_id: orderId },
    });
    return entity ? ExecutionMapper.toDomain(entity) : null;
  }

  async findAll(filters?: ExecutionFilters): Promise<Execution[]> {
    const status = filters?.status ?? ExecutionStatus.QUEUED;
    const entities = await this.repository.find({
      where: { status },
      order: { queued_at: "ASC" },
    });
    return ExecutionMapper.toDomainList(entities);
  }
}
