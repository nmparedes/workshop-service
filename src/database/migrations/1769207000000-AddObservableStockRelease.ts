import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from "typeorm";

export class AddObservableStockRelease1769207000000 implements MigrationInterface {
  name = "AddObservableStockRelease1769207000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("stock_reservations", [
      new TableColumn({
        name: "released_by_event_id",
        type: "varchar",
        length: "64",
        isNullable: true,
      }),
      new TableColumn({
        name: "released_at",
        type: "timestamp",
        precision: 3,
        isNullable: true,
      }),
    ]);
    await queryRunner.createTable(
      new Table({
        name: "stock_release_operations",
        columns: [
          {
            name: "id",
            type: "varchar",
            length: "36",
            isPrimary: true,
          },
          {
            name: "command_event_id",
            type: "varchar",
            length: "64",
            isNullable: false,
          },
          { name: "saga_id", type: "varchar", length: "64" },
          { name: "order_id", type: "varchar", length: "64" },
          { name: "correlation_id", type: "varchar", length: "64" },
          { name: "command_hash", type: "char", length: "64" },
          {
            name: "result_event_name",
            type: "varchar",
            length: "40",
            isNullable: true,
          },
          {
            name: "result_event_id",
            type: "char",
            length: "64",
            isNullable: true,
          },
          {
            name: "result_occurred_at",
            type: "timestamp",
            precision: 3,
            isNullable: true,
          },
          { name: "result_payload", type: "json", isNullable: true },
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
      "stock_release_operations",
      new TableIndex({
        name: "uq_stock_release_operations_command_event_id",
        columnNames: ["command_event_id"],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      "stock_release_operations",
      "uq_stock_release_operations_command_event_id",
    );
    await queryRunner.dropTable("stock_release_operations");
    await queryRunner.dropColumn("stock_reservations", "released_at");
    await queryRunner.dropColumn("stock_reservations", "released_by_event_id");
  }
}
