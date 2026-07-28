import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessagingModule } from "../messaging/rabbitmq-broker";
import { PrometheusExecutionMetrics } from "../common/metrics/prometheus-execution-metrics";
import { TypeOrmConsumedMessageRepository } from "../messaging/consumed-message.repository";
import { ConsumedMessageOrmEntity } from "../messaging/consumed-message.orm-entity";
import { ExecutionService } from "./application/services/execution.service";
import { EXECUTION_EVENT_PUBLISHER } from "./application/ports/execution-event-publisher.interface";
import { EXECUTION_METRICS } from "./application/ports/execution-metrics.port";
import { ExecutionController } from "./infrastructure/controllers/execution.controller";
import { TypeOrmExecutionRepository } from "./infrastructure/repositories/typeorm-execution.repository";
import { ExecutionOrmEntity } from "./infrastructure/typeorm/execution.orm-entity";
import { EXECUTION_REPOSITORY } from "./execution.tokens";
import { ExecutionEventsService } from "../messaging/execution-events.service";
import { ExecutionRabbitMqPublisher } from "../messaging/execution-rabbitmq.publisher";

@Module({
  imports: [
    TypeOrmModule.forFeature([ExecutionOrmEntity, ConsumedMessageOrmEntity]),
    MessagingModule,
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ExecutionEventsService,
    ExecutionRabbitMqPublisher,
    PrometheusExecutionMetrics,
    TypeOrmConsumedMessageRepository,
    {
      provide: EXECUTION_REPOSITORY,
      useClass: TypeOrmExecutionRepository,
    },
    {
      provide: EXECUTION_EVENT_PUBLISHER,
      useExisting: ExecutionRabbitMqPublisher,
    },
    {
      provide: EXECUTION_METRICS,
      useExisting: PrometheusExecutionMetrics,
    },
  ],
  exports: [ExecutionService, EXECUTION_REPOSITORY],
})
export class ExecutionModule {}
