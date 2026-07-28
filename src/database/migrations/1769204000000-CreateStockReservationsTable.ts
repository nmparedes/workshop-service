import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateStockReservationsTable1769204000000 implements MigrationInterface {
  name = "CreateStockReservationsTable1769204000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "stock_reservations",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "saga_id", type: "varchar", length: "64", isNullable: false },
          {
            name: "order_id",
            type: "varchar",
            length: "64",
            isNullable: false,
          },
          { name: "part_id", type: "varchar", length: "36", isNullable: false },
          { name: "quantity", type: "int", isNullable: false },
          { name: "status", type: "varchar", length: "20", isNullable: false },
          {
            name: "failure_code",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "failure_reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "stock_reservations",
      new TableIndex({
        name: "uq_stock_reservations_saga_order_part",
        columnNames: ["saga_id", "order_id", "part_id"],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      "stock_reservations",
      new TableIndex({
        name: "idx_stock_reservations_status",
        columnNames: ["status"],
      }),
    );
    await queryRunner.createIndex(
      "stock_reservations",
      new TableIndex({
        name: "idx_stock_reservations_part_id",
        columnNames: ["part_id"],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      "stock_reservations",
      "idx_stock_reservations_part_id",
    );
    await queryRunner.dropIndex(
      "stock_reservations",
      "idx_stock_reservations_status",
    );
    await queryRunner.dropIndex(
      "stock_reservations",
      "uq_stock_reservations_saga_order_part",
    );
    await queryRunner.dropTable("stock_reservations");
  }
}
