import { createDeterministicEventId } from "../../../src/common/events/deterministic-event-id";
import { ExecutionRabbitMqPublisher } from "../../../src/messaging/execution-rabbitmq.publisher";
import type { MessagePublisher } from "../../../src/messaging/rabbitmq-broker";
import type { ExecutionRepository } from "../../../src/execution/domain/repositories/execution.repository.interface";
import { createExecution } from "../execution.factory";

describe("ExecutionRabbitMqPublisher", () => {
  let messagePublisher: jest.Mocked<MessagePublisher>;
  let executionRepository: jest.Mocked<ExecutionRepository>;
  let publisher: ExecutionRabbitMqPublisher;

  beforeEach(() => {
    messagePublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    executionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySagaId: jest.fn(),
      findByOrderId: jest.fn(),
      findAll: jest.fn(),
    };
    publisher = new ExecutionRabbitMqPublisher(
      messagePublisher,
      executionRepository,
    );
  });

  it("publishes execution.started with the persisted exchange, routing key and context", async () => {
    const execution = createExecution({
      status: "IN_DIAGNOSIS" as never,
      diagnosisStartedAt: new Date("2026-07-26T10:10:00.000Z"),
    });
    executionRepository.findById.mockResolvedValue(execution);

    await publisher.publishStarted(execution.id);

    expect(messagePublisher.publish).toHaveBeenCalledWith(
      "workshop.topic",
      "execution.started",
      {
        eventId: createDeterministicEventId(
          "execution.started",
          `${execution.sagaId}:${execution.orderId}`,
          execution.requestEventId!,
        ),
        eventName: "execution.started",
        eventVersion: 1,
        occurredAt: "2026-07-26T10:10:00.000Z",
        correlationId: execution.correlationId!,
        causationId: execution.requestEventId!,
        sagaId: execution.sagaId,
        orderId: execution.orderId,
        payload: {},
      },
    );
  });

  it("publishes execution.finished and execution.failed deterministically", async () => {
    const finished = createExecution({
      status: "FINISHED" as never,
      finishedAt: new Date("2026-07-26T10:20:00.000Z"),
    });
    const failed = createExecution({
      status: "FAILED" as never,
      failedAt: new Date("2026-07-26T10:30:00.000Z"),
      failureCode: "REPAIR_ABORTED",
    });
    executionRepository.findById
      .mockResolvedValueOnce(finished)
      .mockResolvedValueOnce(failed);

    await publisher.publishFinished(finished.id);
    await publisher.publishFailed(failed.id, "REPAIR_ABORTED");

    expect(messagePublisher.publish).toHaveBeenNthCalledWith(
      1,
      "workshop.topic",
      "execution.finished",
      expect.objectContaining({
        eventId: createDeterministicEventId(
          "execution.finished",
          `${finished.sagaId}:${finished.orderId}`,
          finished.requestEventId!,
        ),
        occurredAt: "2026-07-26T10:20:00.000Z",
        payload: {},
      }),
    );
    expect(messagePublisher.publish).toHaveBeenNthCalledWith(
      2,
      "workshop.topic",
      "execution.failed",
      expect.objectContaining({
        eventId: createDeterministicEventId(
          "execution.failed",
          `${failed.sagaId}:${failed.orderId}`,
          failed.requestEventId!,
        ),
        occurredAt: "2026-07-26T10:30:00.000Z",
        payload: { failureCode: "REPAIR_ABORTED" },
      }),
    );
  });

  it("fails when persisted execution context is missing", async () => {
    executionRepository.findById.mockResolvedValue(
      createExecution({
        requestEventId: null,
        correlationId: null,
        status: "IN_DIAGNOSIS" as never,
        diagnosisStartedAt: new Date("2026-07-26T10:10:00.000Z"),
      }),
    );

    await expect(publisher.publishStarted("execution-001")).rejects.toThrow(
      "context is required",
    );
  });
});
