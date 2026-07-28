import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsumedMessageLeaseColumns1769206000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE consumed_messages ADD claim_token varchar(36) NULL, ADD processing_started_at timestamp NULL, ADD lease_expires_at timestamp NULL",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE consumed_messages DROP COLUMN lease_expires_at, DROP COLUMN processing_started_at, DROP COLUMN claim_token",
    );
  }
}
