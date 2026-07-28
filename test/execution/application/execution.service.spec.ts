import { DomainException } from "../../../src/common/exceptions/domain.exception";
import { ExecutionEventPublisher } from "../../../src/execution/application/ports/execution-event-publisher.interface";
import { ExecutionMetrics } from "../../../src/execution/application/ports/execution-metrics.port";
import { ExecutionService } from "../../../src/execution/application/services/execution.service";
import { ExecutionStatus } from "../../../src/execution/domain/enums/execution-status.enum";
import { ExecutionRepository } from "../../../src/execution/domain/repositories/execution.repository.interface";
import { createExecution, createFailExecutionDto } from "../execution.factory";

describe("ExecutionService", () => {
  let repository: jest.Mocked<ExecutionRepository>;
  let eventPublisher: jest.Mocked<ExecutionEventPublisher>;
  let executionMetrics: jest.Mocked<ExecutionMetrics>;
  let service: ExecutionService;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySagaId: jest.fn(),
      findByOrderId: jest.fn(),
      findAll: jest.fn(),
    };
    eventPublisher = {
      publishStarted: jest.fn(),
      publishFinished: jest.fn(),
      publishFailed: jest.fn(),
    };
    executionMetrics = {
      observeDuration: jest.fn(),
    };
    service = new ExecutionService(
      repository,
      eventPublisher,
      executionMetrics,
    );
  });

  it("creates queued executions and keeps identical create idempotent", async () => {
    const execution = createExecution();
    repository.findBySagaId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(execution);
    repository.findByOrderId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(execution);
    repository.save.mockImplementation(async (saved) => saved);

    const created = await service.createQueuedExecution(
      " saga-001 ",
      " order-001 ",
      " request-event-001 ",
      " correlation-001 ",
    );
    const repeated = await service.createQueuedExecution(
      "saga-001",
      "order-001",
      "request-event-001",
      "correlation-001",
    );

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(created.status).toBe(ExecutionStatus.QUEUED);
    expect(created.requestEventId).toBe("request-event-001");
    expect(created.correlationId).toBe("correlation-001");
    expect(repeated.id).toBe(execution.id);
  });

  it("rejects conflicting saga or order identities", async () => {
    repository.findBySagaId.mockResolvedValue(
      createExecution({ orderId: "order-002" }),
    );
    repository.findByOrderId.mockResolvedValue(null);

    await expect(
      service.createQueuedExecution("saga-001", "order-001"),
    ).rejects.toThrow(DomainException);
  });

  it("rejects replay with conflicting persisted message context", async () => {
    const existing = createExecution();
    repository.findBySagaId.mockResolvedValue(existing);
    repository.findByOrderId.mockResolvedValue(existing);

    await expect(
      service.createQueuedExecution(
        "saga-001",
        "order-001",
        "different-event",
        "correlation-001",
      ),
    ).rejects.toThrow(DomainException);
  });

  it("lists queued executions by default and filters by status", async () => {
    repository.findAll.mockResolvedValue([
      createExecution(),
      createExecution({
        id: "execution-002",
        sagaId: "saga-002",
        orderId: "order-002",
      }),
    ]);

    const queued = await service.findAll({});
    const failed = await service.findAll({ status: ExecutionStatus.FAILED });

    expect(repository.findAll).toHaveBeenNthCalledWith(1, {});
    expect(repository.findAll).toHaveBeenNthCalledWith(2, {
      status: ExecutionStatus.FAILED,
    });
    expect(queued).toHaveLength(2);
    expect(failed).toHaveLength(2);
  });

  it("starts diagnosis, repair, finishes and fails through persisted entities", async () => {
    const queued = createExecution();
    const inDiagnosis = createExecution({
      status: ExecutionStatus.IN_DIAGNOSIS,
      diagnosisStartedAt: new Date("2026-07-26T10:05:00.000Z"),
    });
    const inRepair = createExecution({
      status: ExecutionStatus.IN_REPAIR,
      diagnosisStartedAt: new Date("2026-07-26T10:05:00.000Z"),
      repairStartedAt: new Date("2026-07-26T10:15:00.000Z"),
    });

    repository.findById
      .mockResolvedValueOnce(queued)
      .mockResolvedValueOnce(inDiagnosis)
      .mockResolvedValueOnce(inRepair)
      .mockResolvedValueOnce(createExecution());
    repository.save.mockImplementation(async (saved) => saved);

    jest.useFakeTimers();
    await expect(
      (async () => {
        jest.setSystemTime(new Date("2026-07-26T10:05:00.000Z"));
        return service.startDiagnosis("execution-001");
      })(),
    ).resolves.toHaveProperty("status", ExecutionStatus.IN_DIAGNOSIS);
    await expect(
      (async () => {
        jest.setSystemTime(new Date("2026-07-26T10:15:00.000Z"));
        return service.startRepair("execution-001");
      })(),
    ).resolves.toHaveProperty("status", ExecutionStatus.IN_REPAIR);
    await expect(
      (async () => {
        jest.setSystemTime(new Date("2026-07-26T10:25:00.000Z"));
        return service.finish("execution-001");
      })(),
    ).resolves.toHaveProperty("status", ExecutionStatus.FINISHED);
    await expect(
      (async () => {
        jest.setSystemTime(new Date("2026-07-26T10:30:00.000Z"));
        return service.fail("execution-001", createFailExecutionDto());
      })(),
    ).resolves.toHaveProperty("status", ExecutionStatus.FAILED);
    jest.useRealTimers();
    expect(eventPublisher.publishStarted).toHaveBeenCalledWith("execution-001");
    expect(eventPublisher.publishFinished).toHaveBeenCalledWith(
      "execution-001",
    );
    expect(eventPublisher.publishFailed).toHaveBeenCalledWith(
      "execution-001",
      "REPAIR_ABORTED",
    );
    expect(executionMetrics.observeDuration).toHaveBeenNthCalledWith(
      1,
      "diagnosis",
      300,
    );
    expect(executionMetrics.observeDuration).toHaveBeenNthCalledWith(
      2,
      "repair",
      600,
    );
    expect(executionMetrics.observeDuration).toHaveBeenNthCalledWith(
      3,
      "finished",
      600,
    );
  });

  it("re-publishes deterministic events for repeated terminal transitions", async () => {
    const inDiagnosis = createExecution({
      status: ExecutionStatus.IN_DIAGNOSIS,
      diagnosisStartedAt: new Date("2026-07-26T10:05:00.000Z"),
    });
    const finished = createExecution({
      status: ExecutionStatus.FINISHED,
      diagnosisStartedAt: new Date("2026-07-26T10:05:00.000Z"),
      finishedAt: new Date("2026-07-26T10:10:00.000Z"),
    });
    const failed = createExecution({
      status: ExecutionStatus.FAILED,
      failedAt: new Date("2026-07-26T10:10:00.000Z"),
      failureCode: "REPAIR_ABORTED",
      failureReason: "Customer cancelled the repair.",
    });
    repository.findById
      .mockResolvedValueOnce(inDiagnosis)
      .mockResolvedValueOnce(finished)
      .mockResolvedValueOnce(failed);

    await service.startDiagnosis("execution-001");
    await service.finish("execution-001");
    await service.fail("execution-001", createFailExecutionDto());

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventPublisher.publishStarted).toHaveBeenCalledWith("execution-001");
    expect(eventPublisher.publishFinished).toHaveBeenCalledWith(
      "execution-001",
    );
    expect(eventPublisher.publishFailed).toHaveBeenCalledWith(
      "execution-001",
      "REPAIR_ABORTED",
    );
    expect(executionMetrics.observeDuration).not.toHaveBeenCalled();
  });

  it("finds by id or by order and throws when missing", async () => {
    const execution = createExecution();
    repository.findById
      .mockResolvedValueOnce(execution)
      .mockResolvedValueOnce(null);
    repository.findByOrderId.mockResolvedValue(execution);

    await expect(service.findById(execution.id)).resolves.toHaveProperty(
      "id",
      execution.id,
    );
    await expect(
      service.findByOrderId(execution.orderId),
    ).resolves.toHaveProperty("orderId", execution.orderId);
    await expect(service.findById("missing")).rejects.toThrow(DomainException);
  });
});
