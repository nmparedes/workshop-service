import { getRepositoryToken } from "@nestjs/typeorm";
import { Test } from "@nestjs/testing";
import { Repository } from "typeorm";
import { StockReservation } from "../../../src/part/domain/entities/stock-reservation.entity";
import { StockReservationMapper } from "../../../src/part/infrastructure/mappers/stock-reservation.mapper";
import { TypeOrmStockReservationRepository } from "../../../src/part/infrastructure/repositories/typeorm-stock-reservation.repository";
import { StockReservationOrmEntity } from "../../../src/part/infrastructure/typeorm/stock-reservation.orm-entity";
import {
  createStockReservation,
  createStockReservationOrmEntity,
} from "../part.factory";

describe("TypeOrmStockReservationRepository", () => {
  let repository: TypeOrmStockReservationRepository;
  let ormRepository: jest.Mocked<Repository<StockReservationOrmEntity>>;

  beforeEach(async () => {
    ormRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<StockReservationOrmEntity>>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        TypeOrmStockReservationRepository,
        {
          provide: getRepositoryToken(StockReservationOrmEntity),
          useValue: ormRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get(TypeOrmStockReservationRepository);
  });

  it("saves stock reservations", async () => {
    const reservation = createStockReservation();
    ormRepository.save.mockResolvedValue(
      StockReservationMapper.toOrmEntity(reservation),
    );

    const result = await repository.save(reservation);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: reservation.id,
        saga_id: reservation.sagaId,
        order_id: reservation.orderId,
        part_id: reservation.partId,
      }),
    );
    expect(result).toBeInstanceOf(StockReservation);
  });

  it("finds reservations by saga, order and part", async () => {
    const ormEntity = createStockReservationOrmEntity();
    ormRepository.findOne.mockResolvedValue(ormEntity);

    await expect(
      repository.findBySagaIdOrderIdPartId(" saga-001 ", " order-001 ", " id "),
    ).resolves.toBeInstanceOf(StockReservation);
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: {
        saga_id: "saga-001",
        order_id: "order-001",
        part_id: "id",
      },
    });
  });

  it("returns null when the reservation does not exist", async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findBySagaIdOrderIdPartId("saga-001", "order-001", "part-001"),
    ).resolves.toBeNull();
  });
});
