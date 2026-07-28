import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { validateEnvironment } from "./common/config/environment.validation";
import { DatabaseModule } from "./database/database.module";
import { ExecutionModule } from "./execution/execution.module";
import { HealthModule } from "./health/health.module";
import { MessagingModule } from "./messaging/rabbitmq-broker";
import { PartModule } from "./part/part.module";
import { ServiceCatalogModule } from "./service-catalog/service-catalog.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    ServiceCatalogModule,
    PartModule,
    ExecutionModule,
    HealthModule,
    MessagingModule,
  ],
})
export class AppModule {}
