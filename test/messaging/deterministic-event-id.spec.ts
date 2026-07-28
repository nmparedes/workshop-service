import { createDeterministicEventId } from "../../src/messaging/deterministic-event-id";

describe("createDeterministicEventId", () => {
  it("is stable for a retry of the same stock transition", () => {
    expect(
      createDeterministicEventId("stock.reserved", "saga-1:order-1", "event-1"),
    ).toBe(
      createDeterministicEventId("stock.reserved", "saga-1:order-1", "event-1"),
    );
  });

  it("distinguishes a different command transition", () => {
    expect(
      createDeterministicEventId("stock.reserved", "saga-1:order-1", "event-1"),
    ).not.toBe(
      createDeterministicEventId("stock.reserved", "saga-1:order-1", "event-2"),
    );
  });
});
