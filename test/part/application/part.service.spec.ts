import { PartService } from "../../../src/part/application/services/part.service";
import { PartAlreadyExistsException } from "../../../src/part/domain/exceptions/part-already-exists.exception";
import { PartNotFoundException } from "../../../src/part/domain/exceptions/part-not-found.exception";
import { PartRepository } from "../../../src/part/domain/repositories/part.repository.interface";
import {
  createPart,
  createPartDto,
  stockMovementDto,
  updatePartDto,
} from "../part.factory";

describe("PartService", () => {
  let repository: jest.Mocked<PartRepository>;
  let service: PartService;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findBelowMinimumStock: jest.fn(),
      delete: jest.fn(),
    };
    service = new PartService(repository);
  });

  it("creates parts when the code is unique", async () => {
    const dto = createPartDto({ code: " oil-123 ", name: " Engine oil 5W30 " });
    const part = createPart({ code: "OIL-123", name: "Engine oil 5W30" });
    repository.findByCode.mockResolvedValue(null);
    repository.save.mockResolvedValue(part);

    const result = await service.create(dto);

    expect(repository.findByCode).toHaveBeenCalledWith("OIL-123");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: expect.objectContaining({ rawValue: "OIL-123" }),
      }),
    );
    expect(result).toMatchObject({
      code: "OIL-123",
      name: "Engine oil 5W30",
      unitPrice: 45.99,
      formattedUnitPrice: expect.any(String),
      availableQuantity: 20,
      reservedQuantity: 5,
      totalQuantity: 25,
      minimumQuantity: 10,
      belowMinimumStock: false,
      hasAvailableStock: true,
      unit: "L",
      active: true,
    });
  });

  it("rejects duplicate codes on create", async () => {
    repository.findByCode.mockResolvedValue(createPart());

    await expect(service.create(createPartDto())).rejects.toThrow(
      PartAlreadyExistsException,
    );
  });

  it("finds parts by id and code", async () => {
    const part = createPart();
    repository.findById.mockResolvedValue(part);
    repository.findByCode.mockResolvedValue(part);

    await expect(service.findById(part.id)).resolves.toHaveProperty(
      "id",
      part.id,
    );
    await expect(
      service.findByCode(part.code.rawValue),
    ).resolves.toHaveProperty("code", part.code.rawValue);
  });

  it("throws when a part is not found", async () => {
    repository.findById.mockResolvedValue(null);
    repository.findByCode.mockResolvedValue(null);

    await expect(service.findById("missing")).rejects.toThrow(
      PartNotFoundException,
    );
    await expect(service.findByCode("missing")).rejects.toThrow(
      PartNotFoundException,
    );
  });

  it("lists parts with filters and pagination metadata", async () => {
    const parts = [
      createPart(),
      createPart({
        id: "550e8400-e29b-41d4-a716-446655440101",
        code: "BRK-456",
      }),
    ];
    repository.findAll.mockResolvedValueOnce(parts.slice(0, 1));
    repository.findAll.mockResolvedValueOnce(parts);

    const result = await service.findAll({
      code: "oil",
      name: "Engine",
      minPrice: 10,
      maxPrice: 100,
      unit: "l",
      onlyBelowMinimumStock: false,
      onlyWithStock: true,
      active: true,
      page: 1,
      limit: 1,
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    });
    expect(repository.findAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ code: "OIL", unit: "L", page: 1, limit: 1 }),
    );
    expect(repository.findAll).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ page: expect.any(Number) }),
    );
  });

  it("finds parts below minimum stock", async () => {
    const part = createPart({ availableQuantity: 2, minimumQuantity: 10 });
    repository.findBelowMinimumStock.mockResolvedValue([part]);

    await expect(service.findBelowMinimumStock()).resolves.toEqual([
      expect.objectContaining({ belowMinimumStock: true }),
    ]);
  });

  it("updates and soft deletes parts", async () => {
    const part = createPart();
    repository.findById.mockResolvedValue(part);
    repository.save.mockImplementation(async (savedPart) => savedPart);

    const updated = await service.update(part.id, updatePartDto());
    await service.delete(part.id);

    expect(updated).toMatchObject({
      name: "Brake pad",
      unitPrice: 120,
      unit: "PAR",
    });
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it("throws when updating or deleting a missing part", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.update("missing", updatePartDto())).rejects.toThrow(
      PartNotFoundException,
    );
    await expect(service.delete("missing")).rejects.toThrow(
      PartNotFoundException,
    );
  });

  it("applies stock movement operations", async () => {
    repository.findById.mockImplementation(async () =>
      createPart({ availableQuantity: 20, reservedQuantity: 5 }),
    );
    repository.save.mockImplementation(async (savedPart) => savedPart);

    await expect(
      service.addStock("part-1", stockMovementDto({ quantity: 2 })),
    ).resolves.toMatchObject({ availableQuantity: 22, reservedQuantity: 5 });
    await expect(
      service.removeStock("part-1", stockMovementDto({ quantity: 2 })),
    ).resolves.toMatchObject({ availableQuantity: 18, reservedQuantity: 5 });
    await expect(
      service.reserveStock("part-1", stockMovementDto({ quantity: 2 })),
    ).resolves.toMatchObject({ availableQuantity: 18, reservedQuantity: 7 });
    await expect(
      service.releaseStock("part-1", stockMovementDto({ quantity: 2 })),
    ).resolves.toMatchObject({ availableQuantity: 22, reservedQuantity: 3 });
    await expect(
      service.commitReservedStock("part-1", stockMovementDto({ quantity: 2 })),
    ).resolves.toMatchObject({ availableQuantity: 20, reservedQuantity: 3 });
  });
});
