import { ServiceCatalogService } from "../../../src/service-catalog/application/services/service-catalog.service";
import { ServiceCatalogController } from "../../../src/service-catalog/infrastructure/controllers/service-catalog.controller";
import {
  createServiceCatalogItem,
  createServiceCatalogItemDto,
  updateServiceCatalogItemDto,
} from "../service-catalog.factory";

describe("ServiceCatalogController", () => {
  let service: jest.Mocked<ServiceCatalogService>;
  let controller: ServiceCatalogController;

  beforeEach(() => {
    const item = createServiceCatalogItem();
    const response = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      formattedPrice: "R$ 150,00",
      estimatedMinutes: item.estimatedMinutes,
      formattedEstimatedTime: "1h 30min",
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    service = {
      create: jest.fn().mockResolvedValue(response),
      findAll: jest.fn().mockResolvedValue({ data: [response], meta: {} }),
      findByName: jest.fn().mockResolvedValue(response),
      findById: jest.fn().mockResolvedValue(response),
      update: jest.fn().mockResolvedValue(response),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ServiceCatalogService>;
    controller = new ServiceCatalogController(service);
  });

  it("delegates service catalog endpoints to the application service", async () => {
    const createDto = createServiceCatalogItemDto();
    const updateDto = updateServiceCatalogItemDto();

    await controller.create(createDto);
    await controller.findAll({ page: 1, limit: 10 });
    await controller.findByName("Oil change");
    await controller.findById("item-1");
    await controller.update("item-1", updateDto);
    await controller.delete("item-1");

    expect(service.create).toHaveBeenCalledWith(createDto);
    expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(service.findByName).toHaveBeenCalledWith("Oil change");
    expect(service.findById).toHaveBeenCalledWith("item-1");
    expect(service.update).toHaveBeenCalledWith("item-1", updateDto);
    expect(service.delete).toHaveBeenCalledWith("item-1");
  });
});
