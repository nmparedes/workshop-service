import { ServiceCatalogService } from "../../../src/service-catalog/application/services/service-catalog.service";
import { ServiceCatalogItemAlreadyExistsException } from "../../../src/service-catalog/domain/exceptions/service-catalog-item-already-exists.exception";
import { ServiceCatalogItemNotFoundException } from "../../../src/service-catalog/domain/exceptions/service-catalog-item-not-found.exception";
import { ServiceCatalogItemRepository } from "../../../src/service-catalog/domain/repositories/service-catalog-item.repository.interface";
import {
  createServiceCatalogItem,
  createServiceCatalogItemDto,
  updateServiceCatalogItemDto,
} from "../service-catalog.factory";

describe("ServiceCatalogService", () => {
  let repository: jest.Mocked<ServiceCatalogItemRepository>;
  let service: ServiceCatalogService;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    service = new ServiceCatalogService(repository);
  });

  it("creates service catalog items when the name is unique", async () => {
    const dto = createServiceCatalogItemDto({ name: "  Oil change  " });
    const item = createServiceCatalogItem({ name: "Oil change" });
    repository.findByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(item);

    const result = await service.create(dto);

    expect(repository.findByName).toHaveBeenCalledWith("Oil change");
    expect(repository.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      name: "Oil change",
      price: 150,
      estimatedMinutes: 90,
      active: true,
    });
  });

  it("rejects duplicate names on create and update", async () => {
    repository.findByName.mockResolvedValue(createServiceCatalogItem());

    await expect(service.create(createServiceCatalogItemDto())).rejects.toThrow(
      ServiceCatalogItemAlreadyExistsException,
    );

    repository.findById.mockResolvedValue(createServiceCatalogItem());
    await expect(
      service.update("item-1", updateServiceCatalogItemDto()),
    ).rejects.toThrow(ServiceCatalogItemAlreadyExistsException);
  });

  it("finds items by id and name", async () => {
    const item = createServiceCatalogItem();
    repository.findById.mockResolvedValue(item);
    repository.findByName.mockResolvedValue(item);

    await expect(service.findById(item.id)).resolves.toHaveProperty(
      "id",
      item.id,
    );
    await expect(service.findByName(item.name)).resolves.toHaveProperty(
      "name",
      item.name,
    );
  });

  it("throws when an item is not found", async () => {
    repository.findById.mockResolvedValue(null);
    repository.findByName.mockResolvedValue(null);

    await expect(service.findById("missing")).rejects.toThrow(
      ServiceCatalogItemNotFoundException,
    );
    await expect(service.findByName("missing")).rejects.toThrow(
      ServiceCatalogItemNotFoundException,
    );
  });

  it("lists items with filters and pagination metadata", async () => {
    const items = [
      createServiceCatalogItem(),
      createServiceCatalogItem({ id: "item-2", name: "Wheel alignment" }),
    ];
    repository.findAll.mockResolvedValueOnce(items.slice(0, 1));
    repository.findAll.mockResolvedValueOnce(items);

    const result = await service.findAll({
      name: "Oil",
      minPrice: 50,
      maxPrice: 200,
      minEstimatedMinutes: 30,
      maxEstimatedMinutes: 120,
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
      expect.objectContaining({ page: 1, limit: 1 }),
    );
    expect(repository.findAll).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ page: expect.any(Number) }),
    );
  });

  it("updates and soft deletes items", async () => {
    const item = createServiceCatalogItem();
    repository.findById.mockResolvedValue(item);
    repository.findByName.mockResolvedValue(null);
    repository.save.mockImplementation(async (savedItem) => savedItem);

    const updated = await service.update(
      item.id,
      updateServiceCatalogItemDto(),
    );
    await service.delete(item.id);

    expect(updated.name).toBe("Wheel alignment");
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it("throws when updating or deleting a missing item", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update("missing", updateServiceCatalogItemDto()),
    ).rejects.toThrow(ServiceCatalogItemNotFoundException);
    await expect(service.delete("missing")).rejects.toThrow(
      ServiceCatalogItemNotFoundException,
    );
  });
});
