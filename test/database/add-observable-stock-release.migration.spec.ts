import { AddObservableStockRelease1769207000000 } from "../../src/database/migrations/1769207000000-AddObservableStockRelease";

describe("AddObservableStockRelease1769207000000", () => {
  const queryRunner = {
    addColumns: jest.fn(),
    createTable: jest.fn(),
    createIndex: jest.fn(),
    dropIndex: jest.fn(),
    dropTable: jest.fn(),
    dropColumn: jest.fn(),
  };
  const migration = new AddObservableStockRelease1769207000000();

  beforeEach(() => jest.clearAllMocks());

  it("adds reservation release audit fields and the operation table", async () => {
    await migration.up(queryRunner as never);
    expect(queryRunner.addColumns).toHaveBeenCalledWith(
      "stock_reservations",
      expect.arrayContaining([
        expect.objectContaining({ name: "released_by_event_id" }),
        expect.objectContaining({ name: "released_at" }),
      ]),
    );
    expect(queryRunner.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ name: "stock_release_operations" }),
    );
    expect(queryRunner.createIndex).toHaveBeenCalledWith(
      "stock_release_operations",
      expect.objectContaining({
        name: "uq_stock_release_operations_command_event_id",
        isUnique: true,
      }),
    );
  });

  it("reverts the operation table and audit fields", async () => {
    await migration.down(queryRunner as never);
    expect(queryRunner.dropTable).toHaveBeenCalledWith(
      "stock_release_operations",
    );
    expect(queryRunner.dropColumn.mock.calls).toEqual([
      ["stock_reservations", "released_at"],
      ["stock_reservations", "released_by_event_id"],
    ]);
  });
});
