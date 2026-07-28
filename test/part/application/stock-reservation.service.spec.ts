import { StockReservationService } from "../../../src/part/application/services/stock-reservation.service";
import { PartRepository } from "../../../src/part/domain/repositories/part.repository.interface";
import { StockReservationRepository } from "../../../src/part/domain/repositories/stock-reservation.repository.interface";
import { StockReservationConflictException } from "../../../src/part/domain/exceptions/stock-reservation-conflict.exception";
import { StockReservationNotFoundException } from "../../../src/part/domain/exceptions/stock-reservation-not-found.exception";
import { StockReservationStatus } from "../../../src/part/domain/enums/stock-reservation-status.enum";
import {
  createPart,
  createStockReservation,
  reserveStockCommand,
  stockReservationIdentity,
} from "../part.factory";

describe("StockReservationService", () => {
  let partRepository: jest.Mocked<PartRepository>;
  let stockReservationRepository: jest.Mocked<StockReservationRepository>;
  let service: StockReservationService;

  beforeEach(() => {
    partRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findBelowMinimumStock: jest.fn(),
      delete: jest.fn(),
    };
    stockReservationRepository = {
      save: jest.fn(),
      findBySagaIdOrderIdPartId: jest.fn(),
    };
    service = new StockReservationService(
      partRepository,
      stockReservationRepository,
    );
  });

  it("creates a reserved record and updates stock", async () => {
    const command = reserveStockCommand();
    const part = createPart({ availableQuantity: 20, reservedQuantity: 5 });
    const savedReservation = createStockReservation();
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      null,
    );
    partRepository.findById.mockResolvedValue(part);
    partRepository.save.mockImplementation(async (savedPart) => savedPart);
    stockReservationRepository.save.mockResolvedValue(savedReservation);

    const result = await service.reserveStock(command);

    expect(partRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ availableQuantity: 17, reservedQuantity: 8 }),
    );
    expect(stockReservationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sagaId: command.sagaId,
        orderId: command.orderId,
        partId: command.partId,
        quantity: command.quantity,
        status: StockReservationStatus.RESERVED,
      }),
    );
    expect(result.status).toBe(StockReservationStatus.RESERVED);
  });

  it("returns the existing reservation for duplicate reserve commands", async () => {
    const existingReservation = createStockReservation();
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      existingReservation,
    );

    const result = await service.reserveStock(reserveStockCommand());

    expect(partRepository.findById).not.toHaveBeenCalled();
    expect(stockReservationRepository.save).not.toHaveBeenCalled();
    expect(result.status).toBe(StockReservationStatus.RESERVED);
  });

  it("rejects duplicate reserve commands with different quantity", async () => {
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      createStockReservation({ quantity: 3 }),
    );

    await expect(
      service.reserveStock(reserveStockCommand({ quantity: 4 })),
    ).rejects.toThrow(StockReservationConflictException);
  });

  it("stores FAILED when the part does not exist", async () => {
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      null,
    );
    partRepository.findById.mockResolvedValue(null);
    stockReservationRepository.save.mockResolvedValue(
      createStockReservation({
        status: StockReservationStatus.FAILED,
        failureCode: "PART_NOT_FOUND",
        failureReason: "Part was not found for stock reservation.",
      }),
    );

    const result = await service.reserveStock(reserveStockCommand());

    expect(result.status).toBe(StockReservationStatus.FAILED);
    expect(result.failureCode).toBe("PART_NOT_FOUND");
    expect(partRepository.save).not.toHaveBeenCalled();
  });

  it("stores FAILED when the stock reservation cannot be created", async () => {
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      null,
    );
    partRepository.findById.mockResolvedValue(
      createPart({ availableQuantity: 1, reservedQuantity: 0 }),
    );
    stockReservationRepository.save.mockResolvedValue(
      createStockReservation({
        status: StockReservationStatus.FAILED,
        failureCode: "PART_STOCK_INSUFFICIENT",
        failureReason: "Available stock is insufficient.",
      }),
    );

    const result = await service.reserveStock(
      reserveStockCommand({ quantity: 3 }),
    );

    expect(result.status).toBe(StockReservationStatus.FAILED);
    expect(result.failureCode).toBe("PART_STOCK_INSUFFICIENT");
    expect(partRepository.save).not.toHaveBeenCalled();
  });

  it("releases a reserved stock reservation idempotently", async () => {
    const reservation = createStockReservation();
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      reservation,
    );
    partRepository.findById.mockResolvedValue(
      createPart({ availableQuantity: 17, reservedQuantity: 8 }),
    );
    partRepository.save.mockImplementation(async (savedPart) => savedPart);
    stockReservationRepository.save.mockImplementation(
      async (savedReservation) => savedReservation,
    );

    const released = await service.releaseStockReservation(
      stockReservationIdentity(),
    );
    const duplicate = await service.releaseStockReservation(
      stockReservationIdentity(),
    );

    expect(released.status).toBe(StockReservationStatus.RELEASED);
    expect(duplicate.status).toBe(StockReservationStatus.RELEASED);
    expect(partRepository.save).toHaveBeenCalledTimes(1);
  });

  it("commits a reserved stock reservation idempotently", async () => {
    const reservation = createStockReservation();
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      reservation,
    );
    partRepository.findById.mockResolvedValue(
      createPart({ availableQuantity: 17, reservedQuantity: 8 }),
    );
    partRepository.save.mockImplementation(async (savedPart) => savedPart);
    stockReservationRepository.save.mockImplementation(
      async (savedReservation) => savedReservation,
    );

    const committed = await service.commitStockReservation(
      stockReservationIdentity(),
    );
    const duplicate = await service.commitStockReservation(
      stockReservationIdentity(),
    );

    expect(committed.status).toBe(StockReservationStatus.COMMITTED);
    expect(duplicate.status).toBe(StockReservationStatus.COMMITTED);
    expect(partRepository.save).toHaveBeenCalledTimes(1);
  });

  it("fails settlement when the reserved stock cannot be found on the part", async () => {
    const reservation = createStockReservation();
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      reservation,
    );
    partRepository.findById.mockResolvedValue(
      createPart({ availableQuantity: 20, reservedQuantity: 0 }),
    );
    stockReservationRepository.save.mockImplementation(
      async (savedReservation) => savedReservation,
    );

    const result = await service.commitStockReservation(
      stockReservationIdentity(),
    );

    expect(result.status).toBe(StockReservationStatus.FAILED);
    expect(result.failureCode).toBe("PART_RESERVED_STOCK_INSUFFICIENT");
  });

  it("throws when releasing or committing a missing reservation", async () => {
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      null,
    );

    await expect(
      service.releaseStockReservation(stockReservationIdentity()),
    ).rejects.toThrow(StockReservationNotFoundException);
    await expect(
      service.commitStockReservation(stockReservationIdentity()),
    ).rejects.toThrow(StockReservationNotFoundException);
  });

  it("stores FAILED when the part is missing during settlement", async () => {
    stockReservationRepository.findBySagaIdOrderIdPartId.mockResolvedValue(
      createStockReservation(),
    );
    partRepository.findById.mockResolvedValue(null);
    stockReservationRepository.save.mockImplementation(
      async (savedReservation) => savedReservation,
    );

    const result = await service.releaseStockReservation(
      stockReservationIdentity(),
    );

    expect(result.status).toBe(StockReservationStatus.FAILED);
    expect(result.failureCode).toBe("PART_NOT_FOUND");
  });
});
