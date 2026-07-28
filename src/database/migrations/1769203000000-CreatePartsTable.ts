import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePartsTable1769203000000 implements MigrationInterface {
  name = "CreatePartsTable1769203000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "parts",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "code", type: "varchar", length: "20", isNullable: false },
          { name: "name", type: "varchar", length: "100", isNullable: false },
          {
            name: "description",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "unit_price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "available_quantity",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "reserved_quantity",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "minimum_quantity",
            type: "int",
            default: 0,
            isNullable: false,
          },
          { name: "unit", type: "varchar", length: "10", isNullable: false },
          {
            name: "active",
            type: "boolean",
            default: true,
            isNullable: false,
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
      "parts",
      new TableIndex({
        name: "idx_parts_code",
        columnNames: ["code"],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      "parts",
      new TableIndex({ name: "idx_parts_name", columnNames: ["name"] }),
    );
    await queryRunner.createIndex(
      "parts",
      new TableIndex({ name: "idx_parts_active", columnNames: ["active"] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("parts", "idx_parts_active");
    await queryRunner.dropIndex("parts", "idx_parts_name");
    await queryRunner.dropIndex("parts", "idx_parts_code");
    await queryRunner.dropTable("parts");
  }
}
