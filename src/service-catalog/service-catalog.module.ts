import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceCatalogService } from "./application/services/service-catalog.service";
import { SERVICE_CATALOG_ITEM_REPOSITORY } from "./service-catalog.tokens";
import { ServiceCatalogController } from "./infrastructure/controllers/service-catalog.controller";
import { TypeOrmServiceCatalogItemRepository } from "./infrastructure/repositories/typeorm-service-catalog-item.repository";
import { ServiceCatalogItemOrmEntity } from "./infrastructure/typeorm/service-catalog-item.orm-entity";

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCatalogItemOrmEntity])],
  controllers: [ServiceCatalogController],
  providers: [
    ServiceCatalogService,
    {
      provide: SERVICE_CATALOG_ITEM_REPOSITORY,
      useClass: TypeOrmServiceCatalogItemRepository,
    },
  ],
  exports: [ServiceCatalogService, SERVICE_CATALOG_ITEM_REPOSITORY],
})
export class ServiceCatalogModule {}
