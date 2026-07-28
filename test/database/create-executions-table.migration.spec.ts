import { QueryRunner, Table, TableIndex } from "typeorm";
import { CreateExecutionsTable1769208000000 } from "../../src/database/migrations/1769208000000-CreateExecutionsTable";

describe("CreateExecutionsTable1769208000000", () => {
  let migration: CreateExecutionsTable1769208000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new CreateExecutionsTable1769208000000();
    queryRunner = {
      createTable: jest.fn(),
      createIndex: jest.fn(),
      dropIndex: jest.fn(),
      dropTable: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;
  });

  it("creates the executions table and indexes", async () => {
    await migration.up(queryRunner);

    expect(queryRunner.createTable).toHaveBeenCalledWith(expect.any(Table));
    const table = queryRunner.createTable.mock.calls[0][0] as Table;
    expect(table.name).toBe("executions");
    expect(table.columns.map((column) => column.name)).toEqual([
      "id",
      "saga_id",
      "order_id",
      "status",
      "failure_code",
      "failure_reason",
      "queued_at",
      "diagnosis_started_at",
      "repair_started_at",
      "finished_at",
      "failed_at",
      "created_at",
      "updated_at",
    ]);
    expect(queryRunner.createIndex).toHaveBeenCalledTimes(4);
    expect(queryRunner.createIndex).toHaveBeenCalledWith(
      "executions",
      expect.objectContaining({
        name: "uq_executions_saga_id",
      }) as TableIndex,
    );
  });

  it("drops indexes and table", async () => {
    await migration.down(queryRunner);

    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "executions",
      "idx_executions_queued_at",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "executions",
      "idx_executions_status",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "executions",
      "uq_executions_order_id",
    );
    expect(queryRunner.dropIndex).toHaveBeenCalledWith(
      "executions",
      "uq_executions_saga_id",
    );
    expect(queryRunner.dropTable).toHaveBeenCalledWith("executions");
  });
});
