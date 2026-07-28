import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExecutionEventsService } from "../../src/messaging/execution-events.service";
import { TypeOrmConsumedMessageRepository } from "../../src/messaging/consumed-message.repository";
import { ExecutionRabbitMqPublisher } from "../../src/messaging/execution-rabbitmq.publisher";
import { ExecutionService } from "../../src/execution/application/services/execution.service";
import { ExecutionModule } from "../../src/execution/execution.module";
import { EXECUTION_REPOSITORY } from "../../src/execution/execution.tokens";
import { EXECUTION_EVENT_PUBLISHER } from "../../src/execution/application/ports/execution-event-publisher.interface";
import {
  MESSAGE_CONSUMER,
  MESSAGE_PUBLISHER,
} from "../../src/messaging/rabbitmq-broker";

jest.mock("@nestjs/typeorm", () => ({
  TypeOrmModule: {
    forFeature: jest.fn(() => ({
      module: class MockTypeOrmFeatureModule {},
      providers: [],
      exports: [],
    })),
  },
  InjectRepository: () => () => undefined,
  getRepositoryToken: jest.fn((entity) => `${entity.name}Repository`),
}));

jest.mock("../../src/messaging/rabbitmq-broker", () => ({
  MESSAGE_PUBLISHER: Symbol("MESSAGE_PUBLISHER"),
  MESSAGE_CONSUMER: Symbol("MESSAGE_CONSUMER"),
  MessagingModule: class MockMessagingModule {},
}));

describe("ExecutionModule", () => {
  it("registers execution providers", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExecutionModule],
    })
      .overrideProvider(EXECUTION_REPOSITORY)
      .useValue({})
      .overrideProvider(ExecutionEventsService)
      .useValue({})
      .overrideProvider(ExecutionRabbitMqPublisher)
      .useValue({})
      .overrideProvider(TypeOrmConsumedMessageRepository)
      .useValue({})
      .overrideProvider(EXECUTION_EVENT_PUBLISHER)
      .useValue({})
      .overrideProvider(MESSAGE_PUBLISHER)
      .useValue({})
      .overrideProvider(MESSAGE_CONSUMER)
      .useValue({})
      .compile();

    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      expect.any(Function),
      expect.any(Function),
    ]);
    expect(moduleRef.get(ExecutionService)).toBeInstanceOf(ExecutionService);
  });
});
