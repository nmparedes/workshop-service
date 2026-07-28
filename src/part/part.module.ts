import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PartService } from "./application/services/part.service";
import { StockReservationService } from "./application/services/stock-reservation.service";
import { PART_REPOSITORY, STOCK_RESERVATION_REPOSITORY } from "./part.tokens";
import { PartController } from "./infrastructure/controllers/part.controller";
import { TypeOrmPartRepository } from "./infrastructure/repositories/typeorm-part.repository";
import { TypeOrmStockReservationRepository } from "./infrastructure/repositories/typeorm-stock-reservation.repository";
import { PartOrmEntity } from "./infrastructure/typeorm/part.orm-entity";
import { StockReservationOrmEntity } from "./infrastructure/typeorm/stock-reservation.orm-entity";
import { MessagingModule } from "../messaging/rabbitmq-broker";
import { ConsumedMessageOrmEntity } from "../messaging/consumed-message.orm-entity";
import { TypeOrmConsumedMessageRepository } from "../messaging/consumed-message.repository";
import { StockEventsService } from "../messaging/stock-events.service";
import { StockReleaseService } from "./application/services/stock-release.service";
import { STOCK_RELEASE_UNIT_OF_WORK } from "./part.tokens";
import { StockReleaseOperationOrmEntity } from "./infrastructure/typeorm/stock-release-operation.orm-entity";
import { TypeOrmStockReleaseUnitOfWork } from "./infrastructure/persistence/typeorm-stock-release-unit-of-work";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartOrmEntity,
      StockReservationOrmEntity,
      ConsumedMessageOrmEntity,
      StockReleaseOperationOrmEntity,
    ]),
    MessagingModule,
  ],
  controllers: [PartController],
  providers: [
    PartService,
    StockReservationService,
    StockReleaseService,
    StockEventsService,
    TypeOrmConsumedMessageRepository,
    {
      provide: PART_REPOSITORY,
      useClass: TypeOrmPartRepository,
    },
    {
      provide: STOCK_RESERVATION_REPOSITORY,
      useClass: TypeOrmStockReservationRepository,
    },
    {
      provide: STOCK_RELEASE_UNIT_OF_WORK,
      useClass: TypeOrmStockReleaseUnitOfWork,
    },
  ],
  exports: [
    PartService,
    StockReservationService,
    StockReleaseService,
    PART_REPOSITORY,
    STOCK_RESERVATION_REPOSITORY,
    STOCK_RELEASE_UNIT_OF_WORK,
  ],
})
export class PartModule {}
