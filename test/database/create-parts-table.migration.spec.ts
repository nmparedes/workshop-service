import { QueryRunner, Table, TableIndex } from "typeorm";
import { CreatePartsTable1769203000000 } from "../../src/database/migrations/1769203000000-CreatePartsTable";

describe("CreatePartsTable1769203000000", () => {
  let migration: CreatePartsTable1769203000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new CreatePartsTable1769203000000();
    queryRunner = {
      createTable: jest.fn(),
      createIndex: jest.fn(),
      dropIndex: jest.fn(),
      dropTable: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;
  });

  it("creates the parts table and indexes", async () => {
    await migration.up(queryRunner);

    expect(queryRunner.createTable).toHaveBeenCalledWith(expect.any(Table));
    const table = queryRunner.createTable.mock.calls[0][0] as Table;
    expect(table.name).toBe("parts");
    expect(table.columns.map((column) => column.name)).toEqual([
      "id",
      "code",
      "name",
      "description",
      "unit_price",
      "available_quantity",
      "reserved_quantity",
      "minimum_quantity",
      "unit",
      "active",
      "created_at",
      "updated_at",
    ]);
    expect(queryRunner.createIndex).toHaveBeenCalledTimes(3);
    expect(queryRunner.createIndex).toHaveBeenCalledWith(
      "parts",
      expect.objectContaining({ name: "idx_parts_code" }) as TableIndex,
    );
  });

  it("drops indexes and table", async () => {
    await migration.down(queryRunner);

    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "parts",
      "idx_parts_active",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "parts",
      "idx_parts_name",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "parts",
      "idx_parts_code",
    );
    expect(queryRunner.dropTable).toHaveBeenCalledWith("parts");
  });
});
