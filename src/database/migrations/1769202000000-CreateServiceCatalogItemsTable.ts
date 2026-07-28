import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateServiceCatalogItemsTable1769202000000 implements MigrationInterface {
  name = "CreateServiceCatalogItemsTable1769202000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "service_catalog_items",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "description",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "estimated_minutes",
            type: "int",
            isNullable: false,
          },
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
      "service_catalog_items",
      new TableIndex({
        name: "idx_service_catalog_items_name",
        columnNames: ["name"],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      "service_catalog_items",
      new TableIndex({
        name: "idx_service_catalog_items_active",
        columnNames: ["active"],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      "service_catalog_items",
      "idx_service_catalog_items_active",
    );
    await queryRunner.dropIndex(
      "service_catalog_items",
      "idx_service_catalog_items_name",
    );
    await queryRunner.dropTable("service_catalog_items");
  }
}
