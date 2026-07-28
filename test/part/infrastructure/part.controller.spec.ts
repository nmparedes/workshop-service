import { PartService } from "../../../src/part/application/services/part.service";
import { PartController } from "../../../src/part/infrastructure/controllers/part.controller";
import {
  createPart,
  createPartDto,
  stockMovementDto,
  updatePartDto,
} from "../part.factory";

describe("PartController", () => {
  let service: jest.Mocked<PartService>;
  let controller: PartController;

  beforeEach(() => {
    const part = createPart();
    const response = {
      id: part.id,
      code: part.code.rawValue,
      name: part.name,
      description: part.description,
      unitPrice: part.unitPrice,
      formattedUnitPrice: "R$ 45,99",
      availableQuantity: part.availableQuantity,
      reservedQuantity: part.reservedQuantity,
      totalQuantity: part.totalQuantity,
      minimumQuantity: part.minimumQuantity,
      belowMinimumStock: part.belowMinimumStock,
      hasAvailableStock: part.hasAvailableStock,
      unit: part.unit,
      active: part.active,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };

    service = {
      create: jest.fn().mockResolvedValue(response),
      findAll: jest.fn().mockResolvedValue({ data: [response], meta: {} }),
      findBelowMinimumStock: jest.fn().mockResolvedValue([response]),
      findByCode: jest.fn().mockResolvedValue(response),
      findById: jest.fn().mockResolvedValue(response),
      update: jest.fn().mockResolvedValue(response),
      delete: jest.fn().mockResolvedValue(undefined),
      addStock: jest.fn().mockResolvedValue(response),
      removeStock: jest.fn().mockResolvedValue(response),
      reserveStock: jest.fn().mockResolvedValue(response),
      releaseStock: jest.fn().mockResolvedValue(response),
      commitReservedStock: jest.fn().mockResolvedValue(response),
    } as unknown as jest.Mocked<PartService>;
    controller = new PartController(service);
  });

  it("delegates part endpoints to the application service", async () => {
    const createDto = createPartDto();
    const updateDto = updatePartDto();
    const movementDto = stockMovementDto();

    await controller.create(createDto);
    await controller.findAll({ page: 1, limit: 10 });
    await controller.findBelowMinimumStock();
    await controller.findByCode("OIL-123");
    await controller.findById("part-1");
    await controller.update("part-1", updateDto);
    await controller.delete("part-1");
    await controller.addStock("part-1", movementDto);
    await controller.removeStock("part-1", movementDto);
    await controller.reserveStock("part-1", movementDto);
    await controller.releaseStock("part-1", movementDto);
    await controller.commitReservedStock("part-1", movementDto);

    expect(service.create).toHaveBeenCalledWith(createDto);
    expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(service.findBelowMinimumStock).toHaveBeenCalled();
    expect(service.findByCode).toHaveBeenCalledWith("OIL-123");
    expect(service.findById).toHaveBeenCalledWith("part-1");
    expect(service.update).toHaveBeenCalledWith("part-1", updateDto);
    expect(service.delete).toHaveBeenCalledWith("part-1");
    expect(service.addStock).toHaveBeenCalledWith("part-1", movementDto);
    expect(service.removeStock).toHaveBeenCalledWith("part-1", movementDto);
    expect(service.reserveStock).toHaveBeenCalledWith("part-1", movementDto);
    expect(service.releaseStock).toHaveBeenCalledWith("part-1", movementDto);
    expect(service.commitReservedStock).toHaveBeenCalledWith(
      "part-1",
      movementDto,
    );
  });
});
