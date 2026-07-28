import { Injectable } from "@nestjs/common";
import {
  DataSource,
  type EntityManager,
  QueryFailedError,
  type Repository,
} from "typeorm";
import { DomainException } from "../../../common/exceptions/domain.exception";
import {
  type StockReleaseCommand,
  type StockReleaseOperation,
  type StockReleaseResultItem,
  type StockReleaseUnitOfWork,
} from "../../application/ports/stock-release-unit-of-work.interface";
import { createStockReleaseResultEventId } from "../../application/services/stock-release.service";
import { StockReservationStatus } from "../../domain/enums/stock-reservation-status.enum";
import { StockReleaseOperationMapper } from "../mappers/stock-release-operation.mapper";
import { PartOrmEntity } from "../typeorm/part.orm-entity";
import { StockReleaseOperationOrmEntity } from "../typeorm/stock-release-operation.orm-entity";
import { StockReservationOrmEntity } from "../typeorm/stock-reservation.orm-entity";

@Injectable()
export class TypeOrmStockReleaseUnitOfWork implements StockReleaseUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    command: StockReleaseCommand,
    commandHash: string,
  ): Promise<StockReleaseOperation> {
    try {
      return await this.dataSource.transaction((manager) =>
        this.executeTransaction(manager, command, commandHash),
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing = await this.dataSource
        .getRepository(StockReleaseOperationOrmEntity)
        .findOneBy({ command_event_id: command.commandEventId });
      if (!existing) throw error;
      this.assertSameCommand(existing, command, commandHash);
      return StockReleaseOperationMapper.toApplication(existing);
    }
  }

  private async executeTransaction(
    manager: EntityManager,
    command: StockReleaseCommand,
    commandHash: string,
  ): Promise<StockReleaseOperation> {
    const operations = manager.getRepository(StockReleaseOperationOrmEntity);
    const existing = await operations.findOneBy({
      command_event_id: command.commandEventId,
    });
    if (existing) {
      this.assertSameCommand(existing, command, commandHash);
      return StockReleaseOperationMapper.toApplication(existing);
    }

    const operation = operations.create({
      command_event_id: command.commandEventId,
      saga_id: command.sagaId,
      order_id: command.orderId,
      correlation_id: command.correlationId,
      command_hash: commandHash,
      result_event_name: null,
      result_event_id: null,
      result_occurred_at: null,
      result_payload: null,
    });
    await operations.insert(operation);

    const occurredAt = new Date();
    const results = await this.releaseReservations(
      manager,
      command,
      occurredAt,
    );
    const resultEventName = results.some(({ status }) => status === "FAILED")
      ? "stock.release.failed"
      : "stock.released";
    operation.result_event_name = resultEventName;
    operation.result_event_id = createStockReleaseResultEventId(
      resultEventName,
      command.sagaId,
      command.orderId,
      command.commandEventId,
    );
    operation.result_occurred_at = occurredAt;
    operation.result_payload = { reservations: results };
    await operations.save(operation);
    return StockReleaseOperationMapper.toApplication(operation);
  }

  private async releaseReservations(
    manager: EntityManager,
    command: StockReleaseCommand,
    occurredAt: Date,
  ): Promise<StockReleaseResultItem[]> {
    const reservations = manager.getRepository(StockReservationOrmEntity);
    const parts = manager.getRepository(PartOrmEntity);
    const results = new Map<string, StockReleaseResultItem>();

    for (const requested of [...command.reservations].sort((left, right) =>
      left.partId.localeCompare(right.partId),
    )) {
      results.set(
        requested.partId,
        await this.releaseOne(
          reservations,
          parts,
          command,
          requested,
          occurredAt,
        ),
      );
    }
    return command.reservations.map((item) => results.get(item.partId)!);
  }

  private async releaseOne(
    reservations: Repository<StockReservationOrmEntity>,
    parts: Repository<PartOrmEntity>,
    command: StockReleaseCommand,
    requested: { partId: string; quantity: number },
    occurredAt: Date,
  ): Promise<StockReleaseResultItem> {
    const reservation = await reservations.findOne({
      where: {
        saga_id: command.sagaId,
        order_id: command.orderId,
        part_id: requested.partId,
      },
      lock: { mode: "pessimistic_write" },
    });
    if (!reservation) {
      return failed(requested, "STOCK_RESERVATION_NOT_FOUND");
    }
    if (reservation.quantity !== requested.quantity) {
      return failed(requested, "STOCK_RESERVATION_QUANTITY_MISMATCH");
    }
    if (reservation.status === StockReservationStatus.RELEASED) {
      return reservation.released_by_event_id === command.commandEventId
        ? released(requested)
        : failed(requested, "STOCK_RESERVATION_ALREADY_RELEASED");
    }
    if (reservation.status === StockReservationStatus.COMMITTED) {
      return failed(requested, "STOCK_RESERVATION_ALREADY_COMMITTED");
    }
    if (reservation.status === StockReservationStatus.FAILED) {
      return failed(requested, "STOCK_RESERVATION_NOT_ACTIVE");
    }

    const part = await parts.findOne({
      where: { id: requested.partId },
      lock: { mode: "pessimistic_write" },
    });
    if (!part) return failed(requested, "PART_NOT_FOUND");
    if (part.reserved_quantity < requested.quantity) {
      return failed(requested, "PART_RESERVED_STOCK_INSUFFICIENT");
    }

    part.reserved_quantity -= requested.quantity;
    part.available_quantity += requested.quantity;
    part.updated_at = occurredAt;
    reservation.status = StockReservationStatus.RELEASED;
    reservation.failure_code = null;
    reservation.failure_reason = null;
    reservation.released_by_event_id = command.commandEventId;
    reservation.released_at = occurredAt;
    reservation.updated_at = occurredAt;
    await parts.save(part);
    await reservations.save(reservation);
    return released(requested);
  }

  private assertSameCommand(
    operation: StockReleaseOperationOrmEntity,
    command: StockReleaseCommand,
    commandHash: string,
  ): void {
    if (
      operation.command_hash !== commandHash ||
      operation.saga_id !== command.sagaId ||
      operation.order_id !== command.orderId ||
      operation.correlation_id !== command.correlationId
    ) {
      throw new DomainException(
        "STOCK_RELEASE_COMMAND_CONFLICT",
        "The command event ID is already associated with different content.",
      );
    }
  }
}

function released(item: {
  partId: string;
  quantity: number;
}): StockReleaseResultItem {
  return { ...item, status: "RELEASED" };
}

function failed(
  item: { partId: string; quantity: number },
  failureCode: string,
): StockReleaseResultItem {
  return { ...item, status: "FAILED", failureCode };
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string; errno?: number };
  return driverError.code === "ER_DUP_ENTRY" || driverError.errno === 1062;
}
