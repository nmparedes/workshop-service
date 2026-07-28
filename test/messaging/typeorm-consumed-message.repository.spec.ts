import { QueryFailedError } from "typeorm";
import { TypeOrmConsumedMessageRepository } from "../../src/messaging/consumed-message.repository";

describe("TypeOrmConsumedMessageRepository", () => {
  const ormRepository = {
    insert: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };
  const repository = new TypeOrmConsumedMessageRepository(
    ormRepository as never,
    { get: jest.fn().mockReturnValue(300000) } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it("claims a new message using the SQL unique key", async () => {
    ormRepository.insert.mockResolvedValue({});

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).resolves.toEqual(expect.objectContaining({ token: expect.any(String) }));
    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        consumerName: "workshop-stock-reserve-requested",
        eventId: "event-1",
        status: "PROCESSING",
      }),
    );
  });

  it("does not claim a completed duplicate and atomically retries a failed message", async () => {
    ormRepository.insert.mockRejectedValue(duplicateKeyError());
    ormRepository.findOneBy.mockResolvedValueOnce({ status: "PROCESSED" });

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).resolves.toBeNull();

    ormRepository.findOneBy.mockResolvedValueOnce({ status: "FAILED" });
    ormRepository.update.mockResolvedValueOnce({ affected: 1 });
    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).resolves.toEqual(expect.objectContaining({ token: expect.any(String) }));
    expect(ormRepository.update).toHaveBeenCalledWith(
      {
        consumerName: "workshop-stock-reserve-requested",
        eventId: "event-1",
        status: "FAILED",
      },
      expect.objectContaining({ status: "PROCESSING", processedAt: null }),
    );
  });

  it("rejects concurrent processing of the same event", async () => {
    ormRepository.insert.mockRejectedValue(duplicateKeyError());
    ormRepository.findOneBy.mockResolvedValue({
      status: "PROCESSING",
      leaseExpiresAt: new Date(Date.now() + 60000),
    });

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).rejects.toThrow("already processing");
  });

  it("recovers an expired claim and prevents an old worker from completing it", async () => {
    ormRepository.insert.mockRejectedValue(duplicateKeyError());
    ormRepository.findOneBy.mockResolvedValue({
      status: "PROCESSING",
      leaseExpiresAt: new Date(Date.now() - 1),
    });
    ormRepository.update
      .mockResolvedValueOnce({ affected: 0 })
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 })
      .mockResolvedValueOnce({ affected: 0 });

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).resolves.toEqual(expect.objectContaining({ token: expect.any(String) }));
    await expect(
      repository.markProcessed(
        "workshop-stock-reserve-requested",
        "event-1",
        "old-token",
      ),
    ).rejects.toThrow("claim was lost");
    await expect(
      repository.markFailed(
        "workshop-stock-reserve-requested",
        "event-1",
        "old-token",
      ),
    ).rejects.toThrow("claim was lost");
  });

  it.each([
    [queryFailedError("ECONNREFUSED"), "database unavailable"],
    [queryFailedError("ER_NO_SUCH_TABLE"), "table missing"],
    [queryFailedError("ER_BAD_FIELD_ERROR"), "unclassified error"],
  ])("propagates %s", async (error) => {
    ormRepository.insert.mockRejectedValue(error);

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).rejects.toBe(error);
  });

  it("rejects a missing row after a duplicate-key response", async () => {
    ormRepository.insert.mockRejectedValue(duplicateKeyError());
    ormRepository.findOneBy.mockResolvedValue(null);

    await expect(
      repository.claim("workshop-stock-reserve-requested", "event-1"),
    ).rejects.toThrow("not found after a duplicate key");
  });
});

function duplicateKeyError(): QueryFailedError {
  return new QueryFailedError("insert", [], driverError("ER_DUP_ENTRY", 1062));
}

function queryFailedError(code: string): QueryFailedError {
  return new QueryFailedError("insert", [], driverError(code));
}

function driverError(code: string, errno?: number): Error {
  return Object.assign(new Error(code), {
    code,
    ...(errno === undefined ? {} : { errno }),
  });
}
