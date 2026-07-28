import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { StockReleaseResultItem } from "../../application/ports/stock-release-unit-of-work.interface";

@Entity("stock_release_operations")
export class StockReleaseOperationOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("uq_stock_release_operations_command_event_id", { unique: true })
  @Column({ name: "command_event_id", type: "varchar", length: 64 })
  command_event_id: string;

  @Column({ name: "saga_id", type: "varchar", length: 64 })
  saga_id: string;

  @Column({ name: "order_id", type: "varchar", length: 64 })
  order_id: string;

  @Column({ name: "correlation_id", type: "varchar", length: 64 })
  correlation_id: string;

  @Column({ name: "command_hash", type: "char", length: 64 })
  command_hash: string;

  @Column({
    name: "result_event_name",
    type: "varchar",
    length: 40,
    nullable: true,
  })
  result_event_name: "stock.released" | "stock.release.failed" | null;

  @Column({
    name: "result_event_id",
    type: "char",
    length: 64,
    nullable: true,
  })
  result_event_id: string | null;

  @Column({
    name: "result_occurred_at",
    type: "timestamp",
    precision: 3,
    nullable: true,
  })
  result_occurred_at: Date | null;

  @Column({ name: "result_payload", type: "json", nullable: true })
  result_payload: { reservations: StockReleaseResultItem[] } | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp", precision: 3 })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp", precision: 3 })
  updated_at: Date;
}
