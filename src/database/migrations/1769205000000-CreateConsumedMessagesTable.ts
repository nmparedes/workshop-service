import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConsumedMessagesTable1769205000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE consumed_messages (id char(36) NOT NULL, consumer_name varchar(100) NOT NULL, event_id varchar(64) NOT NULL, status varchar(20) NOT NULL, processed_at timestamp NULL, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uq_consumed_messages_consumer_event (consumer_name, event_id)) ENGINE=InnoDB`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE consumed_messages");
  }
}
