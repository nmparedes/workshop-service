import { QueryRunner } from "typeorm";
import { CreateServiceCatalogItemsTable1769202000000 } from "../../src/database/migrations/1769202000000-CreateServiceCatalogItemsTable";

describe("CreateServiceCatalogItemsTable1769202000000", () => {
  it("creates and drops the service_catalog_items table with indexes", async () => {
    const migration = new CreateServiceCatalogItemsTable1769202000000();
    const queryRunner = {
      createTable: jest.fn(),
      createIndex: jest.fn(),
      dropIndex: jest.fn(),
      dropTable: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    expect(migration.name).toBe("CreateServiceCatalogItemsTable1769202000000");
    expect(queryRunner.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ name: "service_catalog_items" }),
    );
    expect(queryRunner.createIndex).toHaveBeenCalledTimes(2);
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "service_catalog_items",
      "idx_service_catalog_items_name",
    );
    expect(queryRunner.dropTable).toHaveBeenCalledWith("service_catalog_items");
  });
});
