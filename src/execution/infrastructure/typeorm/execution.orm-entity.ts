import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { ExecutionStatus } from "../../domain/enums/execution-status.enum";

@Entity("executions")
export class ExecutionOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Index("uq_executions_saga_id", { unique: true })
  @Column({ type: "varchar", length: 64, name: "saga_id" })
  saga_id: string;

  @Index("uq_executions_order_id", { unique: true })
  @Column({ type: "varchar", length: 64, name: "order_id" })
  order_id: string;

  @Column({
    type: "varchar",
    length: 64,
    name: "request_event_id",
    nullable: true,
  })
  request_event_id: string | null;

  @Column({
    type: "varchar",
    length: 64,
    name: "correlation_id",
    nullable: true,
  })
  correlation_id: string | null;

  @Index("idx_executions_status")
  @Column({ type: "varchar", length: 20 })
  status: ExecutionStatus;

  @Column({
    type: "varchar",
    length: 100,
    name: "failure_code",
    nullable: true,
  })
  failure_code: string | null;

  @Column({
    type: "varchar",
    length: 500,
    name: "failure_reason",
    nullable: true,
  })
  failure_reason: string | null;

  @Index("idx_executions_queued_at")
  @Column({ type: "timestamp", precision: 3, name: "queued_at" })
  queued_at: Date;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "diagnosis_started_at",
    nullable: true,
  })
  diagnosis_started_at: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "repair_started_at",
    nullable: true,
  })
  repair_started_at: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "finished_at",
    nullable: true,
  })
  finished_at: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "failed_at",
    nullable: true,
  })
  failed_at: Date | null;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updated_at" })
  updated_at: Date;
}
