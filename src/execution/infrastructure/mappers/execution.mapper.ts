import { Execution } from "../../domain/entities/execution.entity";
import { ExecutionOrmEntity } from "../typeorm/execution.orm-entity";

export class ExecutionMapper {
  static toDomain(ormEntity: ExecutionOrmEntity): Execution {
    return Execution.restore({
      id: ormEntity.id,
      sagaId: ormEntity.saga_id,
      orderId: ormEntity.order_id,
      requestEventId: ormEntity.request_event_id,
      correlationId: ormEntity.correlation_id,
      status: ormEntity.status,
      failureCode: ormEntity.failure_code,
      failureReason: ormEntity.failure_reason,
      queuedAt: ormEntity.queued_at,
      diagnosisStartedAt: ormEntity.diagnosis_started_at,
      repairStartedAt: ormEntity.repair_started_at,
      finishedAt: ormEntity.finished_at,
      failedAt: ormEntity.failed_at,
      createdAt: ormEntity.created_at,
      updatedAt: ormEntity.updated_at,
    });
  }

  static toOrmEntity(execution: Execution): ExecutionOrmEntity {
    const ormEntity = new ExecutionOrmEntity();
    ormEntity.id = execution.id;
    ormEntity.saga_id = execution.sagaId;
    ormEntity.order_id = execution.orderId;
    ormEntity.request_event_id = execution.requestEventId;
    ormEntity.correlation_id = execution.correlationId;
    ormEntity.status = execution.status;
    ormEntity.failure_code = execution.failureCode;
    ormEntity.failure_reason = execution.failureReason;
    ormEntity.queued_at = execution.queuedAt;
    ormEntity.diagnosis_started_at = execution.diagnosisStartedAt;
    ormEntity.repair_started_at = execution.repairStartedAt;
    ormEntity.finished_at = execution.finishedAt;
    ormEntity.failed_at = execution.failedAt;
    ormEntity.created_at = execution.createdAt;
    ormEntity.updated_at = execution.updatedAt;
    return ormEntity;
  }

  static toDomainList(ormEntities: ExecutionOrmEntity[]): Execution[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }
}
