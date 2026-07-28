import { ExecutionService } from "../../src/execution/application/services/execution.service";
import { ExecutionEventsService } from "../../src/messaging/execution-events.service";
import { TypeOrmConsumedMessageRepository } from "../../src/messaging/consumed-message.repository";

const consumer = { subscribe: jest.fn() };
const executionService = {
  createQueuedExecution: jest.fn(),
} as unknown as jest.Mocked<ExecutionService>;
const consumedMessages = {
  claim: jest.fn(),
  markProcessed: jest.fn(),
  markFailed: jest.fn(),
} as unknown as jest.Mocked<TypeOrmConsumedMessageRepository>;

describe("ExecutionEventsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumedMessages.markProcessed.mockResolvedValue(undefined);
    consumedMessages.markFailed.mockResolvedValue(undefined);
  });

  it("does not register the consumer when messaging is disabled", async () => {
    await service(false).onModuleInit();
    expect(consumer.subscribe).not.toHaveBeenCalled();
  });

  it("subscribes to workshop.execution.requests when messaging is enabled", async () => {
    await service(true).onModuleInit();
    expect(consumer.subscribe).toHaveBeenCalledWith(
      "workshop.execution.requests",
      expect.any(Function),
    );
  });

  it("creates a queued execution from a valid execution.requested message", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    executionService.createQueuedExecution = jest.fn().mockResolvedValue({
      id: "execution-001",
    } as never);

    await service().consumeExecutionRequested(requestMessage());

    expect(consumedMessages.claim).toHaveBeenCalledWith(
      "workshop-execution-requested",
      "event-001",
    );
    expect(executionService.createQueuedExecution).toHaveBeenCalledWith(
      "saga-001",
      "order-001",
      "event-001",
      "correlation-001",
    );
    expect(consumedMessages.markProcessed).toHaveBeenCalledWith(
      "workshop-execution-requested",
      "event-001",
      "claim-1",
    );
  });

  it.each([
    { eventId: "" },
    { eventName: "execution.finished" },
    { eventVersion: 2 },
    { occurredAt: "not-a-date" },
    { correlationId: " " },
    { causationId: " " },
    { sagaId: "" },
    { orderId: "" },
    { payload: { unexpected: true } },
  ])(
    "rejects invalid execution.requested input before claim %#",
    async (override) => {
      await expect(
        service().consumeExecutionRequested({
          ...requestMessage(),
          ...override,
        } as never),
      ).rejects.toThrow("Invalid execution.requested");

      expect(consumedMessages.claim).not.toHaveBeenCalled();
      expect(executionService.createQueuedExecution).not.toHaveBeenCalled();
    },
  );

  it("does nothing for a processed duplicate", async () => {
    consumedMessages.claim.mockResolvedValue(null);

    await service().consumeExecutionRequested(requestMessage());

    expect(executionService.createQueuedExecution).not.toHaveBeenCalled();
    expect(consumedMessages.markProcessed).not.toHaveBeenCalled();
  });

  it("marks technical failure for retry", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    executionService.createQueuedExecution = jest
      .fn()
      .mockRejectedValue(new Error("database unavailable")) as never;

    await expect(
      service().consumeExecutionRequested(requestMessage()),
    ).rejects.toThrow("database unavailable");

    expect(consumedMessages.markFailed).toHaveBeenCalledWith(
      "workshop-execution-requested",
      "event-001",
      "claim-1",
    );
  });

  it("handles a representative flow from requested to finished", async () => {
    consumedMessages.claim.mockResolvedValue({ token: "claim-1" });
    const created = { id: "execution-001" };
    executionService.createQueuedExecution = jest
      .fn()
      .mockResolvedValue(created as never) as never;

    await service().consumeExecutionRequested(requestMessage());

    expect(executionService.createQueuedExecution).toHaveBeenCalledTimes(1);
    expect(consumedMessages.markProcessed).toHaveBeenCalledTimes(1);
  });
});

function service(enabled = true): ExecutionEventsService {
  return new ExecutionEventsService(
    consumer as never,
    executionService as never,
    consumedMessages as never,
    { get: jest.fn().mockReturnValue(enabled) } as never,
  );
}

function requestMessage() {
  return {
    eventId: "event-001",
    eventName: "execution.requested",
    eventVersion: 1,
    occurredAt: "2026-07-26T10:00:00.000Z",
    correlationId: "correlation-001",
    causationId: "payment-approved-event-001",
    sagaId: "saga-001",
    orderId: "order-001",
    payload: {},
  };
}
