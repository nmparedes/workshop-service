import "reflect-metadata";
import { DataSource } from "typeorm";
import { PartOrmEntity } from "../part/infrastructure/typeorm/part.orm-entity";
import { StockReservationOrmEntity } from "../part/infrastructure/typeorm/stock-reservation.orm-entity";
import { ConsumedMessageOrmEntity } from "../messaging/consumed-message.orm-entity";
import { ServiceCatalogItemOrmEntity } from "../service-catalog/infrastructure/typeorm/service-catalog-item.orm-entity";
import { CreateServiceCatalogItemsTable1769202000000 } from "./migrations/1769202000000-CreateServiceCatalogItemsTable";
import { CreatePartsTable1769203000000 } from "./migrations/1769203000000-CreatePartsTable";
import { CreateStockReservationsTable1769204000000 } from "./migrations/1769204000000-CreateStockReservationsTable";
import { CreateConsumedMessagesTable1769205000000 } from "./migrations/1769205000000-CreateConsumedMessagesTable";
import { AddConsumedMessageLeaseColumns1769206000000 } from "./migrations/1769206000000-AddConsumedMessageLeaseColumns";
import { AddObservableStockRelease1769207000000 } from "./migrations/1769207000000-AddObservableStockRelease";
import { StockReleaseOperationOrmEntity } from "../part/infrastructure/typeorm/stock-release-operation.orm-entity";
import { ExecutionOrmEntity } from "../execution/infrastructure/typeorm/execution.orm-entity";
import { CreateExecutionsTable1769208000000 } from "./migrations/1769208000000-CreateExecutionsTable";
import { AddExecutionMessageContext1769209000000 } from "./migrations/1769209000000-AddExecutionMessageContext";

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(value: string | undefined): boolean {
  return value === "true";
}

const workshopServiceDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST ?? "localhost",
  port: readNumber(process.env.DB_PORT, 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: readBoolean(process.env.DB_SSL) ? { rejectUnauthorized: true } : false,
  synchronize: false,
  logging: false,
  entities: [
    ServiceCatalogItemOrmEntity,
    PartOrmEntity,
    StockReservationOrmEntity,
    ConsumedMessageOrmEntity,
    StockReleaseOperationOrmEntity,
    ExecutionOrmEntity,
  ],
  migrations: [
    CreateServiceCatalogItemsTable1769202000000,
    CreatePartsTable1769203000000,
    CreateStockReservationsTable1769204000000,
    CreateConsumedMessagesTable1769205000000,
    AddConsumedMessageLeaseColumns1769206000000,
    AddObservableStockRelease1769207000000,
    CreateExecutionsTable1769208000000,
    AddExecutionMessageContext1769209000000,
  ],
});

export default workshopServiceDataSource;
