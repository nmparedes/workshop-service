import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PartService } from "../../src/part/application/services/part.service";
import { StockReservationService } from "../../src/part/application/services/stock-reservation.service";
import {
  PART_REPOSITORY,
  STOCK_RELEASE_UNIT_OF_WORK,
  STOCK_RESERVATION_REPOSITORY,
} from "../../src/part/part.tokens";
import { PartModule } from "../../src/part/part.module";
import { StockEventsService } from "../../src/messaging/stock-events.service";
import { TypeOrmConsumedMessageRepository } from "../../src/messaging/consumed-message.repository";

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

describe("PartModule", () => {
  it("registers part providers", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PartModule],
    })
      .overrideProvider(PART_REPOSITORY)
      .useValue({})
      .overrideProvider(STOCK_RESERVATION_REPOSITORY)
      .useValue({})
      .overrideProvider(STOCK_RELEASE_UNIT_OF_WORK)
      .useValue({})
      .overrideProvider(StockEventsService)
      .useValue({})
      .overrideProvider(TypeOrmConsumedMessageRepository)
      .useValue({})
      .compile();

    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
    expect(moduleRef.get(PartService)).toBeInstanceOf(PartService);
    expect(moduleRef.get(StockReservationService)).toBeInstanceOf(
      StockReservationService,
    );
  });
});
