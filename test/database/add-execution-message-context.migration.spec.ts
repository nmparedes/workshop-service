import { QueryRunner, TableColumn } from "typeorm";
import { AddExecutionMessageContext1769209000000 } from "../../src/database/migrations/1769209000000-AddExecutionMessageContext";

describe("AddExecutionMessageContext1769209000000", () => {
  let migration: AddExecutionMessageContext1769209000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new AddExecutionMessageContext1769209000000();
    queryRunner = {
      addColumns: jest.fn(),
      dropColumn: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;
  });

  it("adds execution message context columns", async () => {
    await migration.up(queryRunner);

    expect(queryRunner.addColumns).toHaveBeenCalledWith(
      "executions",
      expect.arrayContaining([
        expect.objectContaining({
          name: "request_event_id",
        }) as TableColumn,
        expect.objectContaining({
          name: "correlation_id",
        }) as TableColumn,
      ]),
    );
  });

  it("drops execution message context columns", async () => {
    await migration.down(queryRunner);

    expect(queryRunner.dropColumn).toHaveBeenNthCalledWith(
      1,
      "executions",
      "correlation_id",
    );
    expect(queryRunner.dropColumn).toHaveBeenNthCalledWith(
      2,
      "executions",
      "request_event_id",
    );
  });
});
