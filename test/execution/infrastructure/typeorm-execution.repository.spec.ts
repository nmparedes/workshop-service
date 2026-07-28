import { getRepositoryToken } from "@nestjs/typeorm";
import { Test } from "@nestjs/testing";
import { Repository } from "typeorm";
import { Execution } from "../../../src/execution/domain/entities/execution.entity";
import { ExecutionStatus } from "../../../src/execution/domain/enums/execution-status.enum";
import { ExecutionMapper } from "../../../src/execution/infrastructure/mappers/execution.mapper";
import { TypeOrmExecutionRepository } from "../../../src/execution/infrastructure/repositories/typeorm-execution.repository";
import { ExecutionOrmEntity } from "../../../src/execution/infrastructure/typeorm/execution.orm-entity";
import {
  createExecution,
  createExecutionOrmEntity,
} from "../execution.factory";

describe("TypeOrmExecutionRepository", () => {
  let repository: TypeOrmExecutionRepository;
  let ormRepository: jest.Mocked<Repository<ExecutionOrmEntity>>;

  beforeEach(async () => {
    ormRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<ExecutionOrmEntity>>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        TypeOrmExecutionRepository,
        {
          provide: getRepositoryToken(ExecutionOrmEntity),
          useValue: ormRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get(TypeOrmExecutionRepository);
  });

  it("saves and reads executions", async () => {
    const execution = createExecution();
    ormRepository.save.mockResolvedValue(
      ExecutionMapper.toOrmEntity(execution),
    );
    ormRepository.findOne.mockResolvedValue(createExecutionOrmEntity());

    const saved = await repository.save(execution);
    const byId = await repository.findById(execution.id);
    const bySagaId = await repository.findBySagaId(execution.sagaId);
    const byOrderId = await repository.findByOrderId(execution.orderId);

    expect(saved).toBeInstanceOf(Execution);
    expect(byId).toBeInstanceOf(Execution);
    expect(bySagaId).toBeInstanceOf(Execution);
    expect(byOrderId).toBeInstanceOf(Execution);
    expect(ormRepository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: execution.id },
    });
    expect(ormRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { saga_id: execution.sagaId },
    });
    expect(ormRepository.findOne).toHaveBeenNthCalledWith(3, {
      where: { order_id: execution.orderId },
    });
  });

  it("returns null for missing records and filters queued order", async () => {
    ormRepository.findOne.mockResolvedValue(null);
    ormRepository.find.mockResolvedValue([
      createExecutionOrmEntity(),
      createExecutionOrmEntity({
        id: "execution-002",
        sagaId: "saga-002",
        orderId: "order-002",
      }),
    ]);

    await expect(repository.findById("missing")).resolves.toBeNull();
    await expect(repository.findBySagaId("missing")).resolves.toBeNull();
    await expect(repository.findByOrderId("missing")).resolves.toBeNull();
    await expect(repository.findAll()).resolves.toHaveLength(2);
    await expect(
      repository.findAll({ status: ExecutionStatus.FAILED }),
    ).resolves.toHaveLength(2);

    expect(ormRepository.find).toHaveBeenNthCalledWith(1, {
      where: { status: ExecutionStatus.QUEUED },
      order: { queued_at: "ASC" },
    });
    expect(ormRepository.find).toHaveBeenNthCalledWith(2, {
      where: { status: ExecutionStatus.FAILED },
      order: { queued_at: "ASC" },
    });
  });
});
