import { DomainException } from "../../../src/common/exceptions/domain.exception";
import { Execution } from "../../../src/execution/domain/entities/execution.entity";
import { ExecutionStatus } from "../../../src/execution/domain/enums/execution-status.enum";

describe("Execution", () => {
  it("creates queued executions", () => {
    const execution = Execution.create({
      sagaId: " saga-001 ",
      orderId: " order-001 ",
    });

    expect(execution.status).toBe(ExecutionStatus.QUEUED);
    expect(execution.sagaId).toBe("saga-001");
    expect(execution.orderId).toBe("order-001");
    expect(execution.requestEventId).toBeNull();
    expect(execution.correlationId).toBeNull();
    expect(execution.queuedAt).toBeInstanceOf(Date);
  });

  it("stores optional request context", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
      requestEventId: "event-001",
      correlationId: "correlation-001",
    });

    expect(execution.requestEventId).toBe("event-001");
    expect(execution.correlationId).toBe("correlation-001");
  });

  it("applies valid transitions and idempotent repeats", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });

    execution.startDiagnosis(new Date("2026-07-26T10:10:00.000Z"));
    execution.startDiagnosis(new Date("2026-07-26T10:20:00.000Z"));
    execution.startRepair(new Date("2026-07-26T10:30:00.000Z"));
    execution.startRepair(new Date("2026-07-26T10:40:00.000Z"));
    execution.finish(new Date("2026-07-26T10:50:00.000Z"));
    execution.finish(new Date("2026-07-26T11:00:00.000Z"));

    expect(execution.status).toBe(ExecutionStatus.FINISHED);
    expect(execution.diagnosisStartedAt?.toISOString()).toBe(
      "2026-07-26T10:10:00.000Z",
    );
    expect(execution.repairStartedAt?.toISOString()).toBe(
      "2026-07-26T10:30:00.000Z",
    );
    expect(execution.finishedAt?.toISOString()).toBe(
      "2026-07-26T10:50:00.000Z",
    );
  });

  it("allows failing any non-terminal state and sanitizes the payload", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });

    execution.fail(" repair aborted ", "  Customer requested stop.  ");

    expect(execution.status).toBe(ExecutionStatus.FAILED);
    expect(execution.failureCode).toBe("REPAIR_ABORTED");
    expect(execution.failureReason).toBe("Customer requested stop.");
    expect(execution.failedAt).toBeInstanceOf(Date);
  });

  it("treats the same fail transition as idempotent", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });

    execution.fail("REPAIR_ABORTED", "Customer requested stop.");
    execution.fail("REPAIR_ABORTED", "Customer requested stop.");

    expect(execution.status).toBe(ExecutionStatus.FAILED);
    expect(execution.failureCode).toBe("REPAIR_ABORTED");
  });

  it("rejects invalid, regressive and terminal transitions", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });

    expect(() => execution.startRepair()).toThrow(DomainException);
    expect(() => execution.finish()).toThrow(DomainException);

    execution.startDiagnosis();
    execution.finish();

    expect(() => execution.startRepair()).toThrow(DomainException);
    expect(() => execution.fail("OTHER", "Reason")).toThrow(DomainException);
  });

  it("rejects incompatible repeated failures and empty identifiers", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });
    execution.fail("REPAIR_ABORTED", "Customer requested stop.");

    expect(() => execution.fail("OTHER_REASON", "Different reason")).toThrow(
      DomainException,
    );
    expect(() =>
      Execution.create({
        sagaId: "   ",
        orderId: "order-001",
      }),
    ).toThrow(DomainException);
  });

  it("returns defensive copies of dates", () => {
    const execution = Execution.create({
      sagaId: "saga-001",
      orderId: "order-001",
    });

    const queuedAt = execution.queuedAt;
    queuedAt.setUTCFullYear(2030);

    expect(execution.queuedAt.getUTCFullYear()).toBe(2026);
  });
});
