import { ExecutionService } from "../../../src/execution/application/services/execution.service";
import { ExecutionController } from "../../../src/execution/infrastructure/controllers/execution.controller";
import { createExecution, createFailExecutionDto } from "../execution.factory";

describe("ExecutionController", () => {
  let service: jest.Mocked<ExecutionService>;
  let controller: ExecutionController;

  beforeEach(() => {
    const execution = createExecution();
    const response = {
      id: execution.id,
      sagaId: execution.sagaId,
      orderId: execution.orderId,
      requestEventId: execution.requestEventId,
      correlationId: execution.correlationId,
      status: execution.status,
      failureCode: execution.failureCode,
      failureReason: execution.failureReason,
      queuedAt: execution.queuedAt,
      diagnosisStartedAt: execution.diagnosisStartedAt,
      repairStartedAt: execution.repairStartedAt,
      finishedAt: execution.finishedAt,
      failedAt: execution.failedAt,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };

    service = {
      createQueuedExecution: jest.fn(),
      findAll: jest.fn().mockResolvedValue([response]),
      findById: jest.fn().mockResolvedValue(response),
      findByOrderId: jest.fn(),
      startDiagnosis: jest.fn().mockResolvedValue(response),
      startRepair: jest.fn().mockResolvedValue(response),
      finish: jest.fn().mockResolvedValue(response),
      fail: jest.fn().mockResolvedValue(response),
    } as unknown as jest.Mocked<ExecutionService>;
    controller = new ExecutionController(service);
  });

  it("delegates execution endpoints to the application service", async () => {
    const failDto = createFailExecutionDto();

    await controller.findAll({});
    await controller.findById("execution-001");
    await controller.startDiagnosis("execution-001");
    await controller.startRepair("execution-001");
    await controller.finish("execution-001");
    await controller.fail("execution-001", failDto);

    expect(service.findAll).toHaveBeenCalledWith({});
    expect(service.findById).toHaveBeenCalledWith("execution-001");
    expect(service.startDiagnosis).toHaveBeenCalledWith("execution-001");
    expect(service.startRepair).toHaveBeenCalledWith("execution-001");
    expect(service.finish).toHaveBeenCalledWith("execution-001");
    expect(service.fail).toHaveBeenCalledWith("execution-001", failDto);
  });
});
