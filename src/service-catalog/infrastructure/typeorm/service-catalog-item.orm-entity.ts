import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("service_catalog_items")
export class ServiceCatalogItemOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Index("idx_service_catalog_items_name", { unique: true })
  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  description: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  price: number | string;

  @Column({ type: "int", name: "estimated_minutes", nullable: false })
  estimated_minutes: number;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updated_at: Date;
}
