import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("parts")
export class PartOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Index("idx_parts_code", { unique: true })
  @Column({ type: "varchar", length: 20, nullable: false })
  code: string;

  @Index("idx_parts_name")
  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  description: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "unit_price" })
  unit_price: number | string;

  @Column({ type: "int", name: "available_quantity", default: 0 })
  available_quantity: number;

  @Column({ type: "int", name: "reserved_quantity", default: 0 })
  reserved_quantity: number;

  @Column({ type: "int", name: "minimum_quantity", default: 0 })
  minimum_quantity: number;

  @Column({ type: "varchar", length: 10, nullable: false })
  unit: string;

  @Index("idx_parts_active")
  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updated_at: Date;
}
