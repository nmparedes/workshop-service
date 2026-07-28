import { Execution } from "../../../src/execution/domain/entities/execution.entity";
import { ExecutionMapper } from "../../../src/execution/infrastructure/mappers/execution.mapper";
import {
  createExecution,
  createExecutionOrmEntity,
} from "../execution.factory";

describe("ExecutionMapper", () => {
  it("maps ORM entities to domain executions", () => {
    const domain = ExecutionMapper.toDomain(
      createExecutionOrmEntity({
        failureCode: "REPAIR_ABORTED",
        failureReason: "Customer cancelled the repair.",
      }),
    );

    expect(domain).toBeInstanceOf(Execution);
    expect(domain.failureCode).toBe("REPAIR_ABORTED");
    expect(domain.failureReason).toBe("Customer cancelled the repair.");
    expect(domain.requestEventId).toBe("request-event-001");
    expect(domain.correlationId).toBe("correlation-001");
  });

  it("maps domain executions to ORM entities and lists", () => {
    const execution = createExecution();
    const ormEntity = ExecutionMapper.toOrmEntity(execution);
    const list = ExecutionMapper.toDomainList([ormEntity]);

    expect(ormEntity).toMatchObject({
      id: execution.id,
      saga_id: execution.sagaId,
      order_id: execution.orderId,
      request_event_id: execution.requestEventId,
      correlation_id: execution.correlationId,
      status: execution.status,
    });
    expect(list).toHaveLength(1);
    expect(list[0]).toBeInstanceOf(Execution);
  });
});
