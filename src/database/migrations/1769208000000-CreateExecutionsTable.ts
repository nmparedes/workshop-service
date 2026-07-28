import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
} from "typeorm";

export class CreateExecutionsTable1769208000000 implements MigrationInterface {
  name = "CreateExecutionsTable1769208000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "executions",
        columns: [
          {
            name: "id",
            type: "varchar",
            length: "36",
            isPrimary: true,
          },
          { name: "saga_id", type: "varchar", length: "64" },
          { name: "order_id", type: "varchar", length: "64" },
          { name: "status", type: "varchar", length: "20" },
          {
            name: "failure_code",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "failure_reason",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "queued_at",
            type: "timestamp",
            precision: 3,
          },
          {
            name: "diagnosis_started_at",
            type: "timestamp",
            precision: 3,
            isNullable: true,
          },
          {
            name: "repair_started_at",
            type: "timestamp",
            precision: 3,
            isNullable: true,
          },
          {
            name: "finished_at",
            type: "timestamp",
            precision: 3,
            isNullable: true,
          },
          {
            name: "failed_at",
            type: "timestamp",
            precision: 3,
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            precision: 3,
            default: "CURRENT_TIMESTAMP(3)",
          },
          {
            name: "updated_at",
            type: "timestamp",
            precision: 3,
            default: "CURRENT_TIMESTAMP(3)",
            onUpdate: "CURRENT_TIMESTAMP(3)",
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      "executions",
      new TableIndex({
        name: "uq_executions_saga_id",
        columnNames: ["saga_id"],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      "executions",
      new TableIndex({
        name: "uq_executions_order_id",
        columnNames: ["order_id"],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      "executions",
      new TableIndex({
        name: "idx_executions_status",
        columnNames: ["status"],
      }),
    );
    await queryRunner.createIndex(
      "executions",
      new TableIndex({
        name: "idx_executions_queued_at",
        columnNames: ["queued_at"],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("executions", "idx_executions_queued_at");
    await queryRunner.dropIndex("executions", "idx_executions_status");
    await queryRunner.dropIndex("executions", "uq_executions_order_id");
    await queryRunner.dropIndex("executions", "uq_executions_saga_id");
    await queryRunner.dropTable("executions");
  }
}
