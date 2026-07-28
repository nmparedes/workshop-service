import { QueryRunner, Table, TableIndex } from "typeorm";
import { CreateStockReservationsTable1769204000000 } from "../../src/database/migrations/1769204000000-CreateStockReservationsTable";

describe("CreateStockReservationsTable1769204000000", () => {
  let migration: CreateStockReservationsTable1769204000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new CreateStockReservationsTable1769204000000();
    queryRunner = {
      createTable: jest.fn(),
      createIndex: jest.fn(),
      dropIndex: jest.fn(),
      dropTable: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;
  });

  it("creates the stock_reservations table and indexes", async () => {
    await migration.up(queryRunner);

    expect(queryRunner.createTable).toHaveBeenCalledWith(expect.any(Table));
    const table = queryRunner.createTable.mock.calls[0][0] as Table;
    expect(table.name).toBe("stock_reservations");
    expect(table.columns.map((column) => column.name)).toEqual([
      "id",
      "saga_id",
      "order_id",
      "part_id",
      "quantity",
      "status",
      "failure_code",
      "failure_reason",
      "created_at",
      "updated_at",
    ]);
    expect(queryRunner.createIndex).toHaveBeenCalledTimes(3);
    expect(queryRunner.createIndex).toHaveBeenCalledWith(
      "stock_reservations",
      expect.objectContaining({
        name: "uq_stock_reservations_saga_order_part",
      }) as TableIndex,
    );
  });

  it("drops indexes and table", async () => {
    await migration.down(queryRunner);

    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "stock_reservations",
      "idx_stock_reservations_part_id",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "stock_reservations",
      "idx_stock_reservations_status",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "stock_reservations",
      "uq_stock_reservations_saga_order_part",
    );
    expect(queryRunner.dropTable).toHaveBeenCalledWith("stock_reservations");
  });
});
