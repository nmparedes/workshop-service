import {
  type MigrationInterface,
  type QueryRunner,
  TableColumn,
} from "typeorm";

export class AddExecutionMessageContext1769209000000 implements MigrationInterface {
  name = "AddExecutionMessageContext1769209000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("executions", [
      new TableColumn({
        name: "request_event_id",
        type: "varchar",
        length: "64",
        isNullable: true,
      }),
      new TableColumn({
        name: "correlation_id",
        type: "varchar",
        length: "64",
        isNullable: true,
      }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("executions", "correlation_id");
    await queryRunner.dropColumn("executions", "request_event_id");
  }
}
