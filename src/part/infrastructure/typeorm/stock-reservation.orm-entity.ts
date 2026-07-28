import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { StockReservationStatus } from "../../domain/enums/stock-reservation-status.enum";

@Entity("stock_reservations")
@Index(
  "uq_stock_reservations_saga_order_part",
  ["saga_id", "order_id", "part_id"],
  {
    unique: true,
  },
)
export class StockReservationOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 64, name: "saga_id", nullable: false })
  saga_id: string;

  @Column({ type: "varchar", length: 64, name: "order_id", nullable: false })
  order_id: string;

  @Column({ type: "varchar", length: 36, name: "part_id", nullable: false })
  part_id: string;

  @Column({ type: "int", nullable: false })
  quantity: number;

  @Column({ type: "varchar", length: 20, nullable: false })
  status: StockReservationStatus;

  @Column({
    type: "varchar",
    length: 100,
    name: "failure_code",
    nullable: true,
  })
  failure_code: string | null;

  @Column({
    type: "varchar",
    length: 255,
    name: "failure_reason",
    nullable: true,
  })
  failure_reason: string | null;

  @Column({
    type: "varchar",
    length: 64,
    name: "released_by_event_id",
    nullable: true,
  })
  released_by_event_id: string | null;

  @Column({ type: "timestamp", name: "released_at", nullable: true })
  released_at: Date | null;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updated_at: Date;
}
