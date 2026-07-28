import { CreatePartDto } from "../../src/part/application/dto/create-part.dto";
import {
  ReserveStockCommand,
  StockReservationCommandIdentity,
} from "../../src/part/application/dto/stock-reservation.dto";
import { StockMovementDto } from "../../src/part/application/dto/stock-movement.dto";
import { UpdatePartDto } from "../../src/part/application/dto/update-part.dto";
import { Part } from "../../src/part/domain/entities/part.entity";
import { StockReservation } from "../../src/part/domain/entities/stock-reservation.entity";
import { StockReservationStatus } from "../../src/part/domain/enums/stock-reservation-status.enum";
import { PartOrmEntity } from "../../src/part/infrastructure/typeorm/part.orm-entity";
import { StockReservationOrmEntity } from "../../src/part/infrastructure/typeorm/stock-reservation.orm-entity";

export function createPart(
  overrides: Partial<{
    id: string;
    code: string;
    name: string;
    description: string;
    unitPrice: number;
    availableQuantity: number;
    reservedQuantity: number;
    minimumQuantity: number;
    unit: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): Part {
  return Part.create({
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440100",
    code: overrides.code ?? "OIL-123",
    name: overrides.name ?? "Engine oil 5W30",
    description: overrides.description ?? "Synthetic engine oil",
    unitPrice: overrides.unitPrice ?? 45.99,
    availableQuantity: overrides.availableQuantity ?? 20,
    reservedQuantity: overrides.reservedQuantity ?? 5,
    minimumQuantity: overrides.minimumQuantity ?? 10,
    unit: overrides.unit ?? "L",
    active: overrides.active,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-02T00:00:00.000Z"),
  });
}

export function createPartDto(
  overrides: Partial<CreatePartDto> = {},
): CreatePartDto {
  return {
    code: "OIL-123",
    name: "Engine oil 5W30",
    description: "Synthetic engine oil",
    unitPrice: 45.99,
    availableQuantity: 20,
    minimumQuantity: 10,
    unit: "L",
    ...overrides,
  };
}

export function updatePartDto(
  overrides: Partial<UpdatePartDto> = {},
): UpdatePartDto {
  return {
    name: "Brake pad",
    description: "Ceramic brake pad",
    unitPrice: 120,
    minimumQuantity: 4,
    unit: "PAR",
    ...overrides,
  };
}

export function stockMovementDto(
  overrides: Partial<StockMovementDto> = {},
): StockMovementDto {
  return {
    quantity: 3,
    reason: "Local adjustment",
    ...overrides,
  };
}

export function createPartOrmEntity(
  overrides: Partial<PartOrmEntity> = {},
): PartOrmEntity {
  return {
    id: "550e8400-e29b-41d4-a716-446655440100",
    code: "OIL-123",
    name: "Engine oil 5W30",
    description: "Synthetic engine oil",
    unit_price: 45.99,
    available_quantity: 20,
    reserved_quantity: 5,
    minimum_quantity: 10,
    unit: "L",
    active: true,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-02T00:00:00.000Z"),
    ...overrides,
  } as PartOrmEntity;
}

export function reserveStockCommand(
  overrides: Partial<ReserveStockCommand> = {},
): ReserveStockCommand {
  return {
    sagaId: "saga-001",
    orderId: "order-001",
    partId: "550e8400-e29b-41d4-a716-446655440100",
    quantity: 3,
    ...overrides,
  };
}

export function stockReservationIdentity(
  overrides: Partial<StockReservationCommandIdentity> = {},
): StockReservationCommandIdentity {
  return {
    sagaId: "saga-001",
    orderId: "order-001",
    partId: "550e8400-e29b-41d4-a716-446655440100",
    ...overrides,
  };
}

export function createStockReservation(
  overrides: Partial<{
    id: string;
    sagaId: string;
    orderId: string;
    partId: string;
    quantity: number;
    status: StockReservationStatus;
    failureCode: string | null;
    failureReason: string | null;
    releasedByEventId: string | null;
    releasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): StockReservation {
  const base = {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440200",
    sagaId: overrides.sagaId ?? "saga-001",
    orderId: overrides.orderId ?? "order-001",
    partId: overrides.partId ?? "550e8400-e29b-41d4-a716-446655440100",
    quantity: overrides.quantity ?? 3,
    createdAt: overrides.createdAt ?? new Date("2024-01-03T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-04T00:00:00.000Z"),
  };

  if (overrides.status === StockReservationStatus.FAILED) {
    return StockReservation.createFailed({
      ...base,
      failureCode: overrides.failureCode ?? "PART_STOCK_INSUFFICIENT",
      failureReason:
        overrides.failureReason ?? "Available stock is insufficient.",
    });
  }

  const reservation = StockReservation.createReserved(base);

  if (overrides.status === StockReservationStatus.RELEASED) {
    reservation.release(
      overrides.releasedByEventId ?? undefined,
      overrides.releasedAt ?? undefined,
    );
  }

  if (overrides.status === StockReservationStatus.COMMITTED) {
    reservation.commit();
  }

  return reservation;
}

export function createStockReservationOrmEntity(
  overrides: Partial<StockReservationOrmEntity> = {},
): StockReservationOrmEntity {
  return {
    id: "550e8400-e29b-41d4-a716-446655440200",
    saga_id: "saga-001",
    order_id: "order-001",
    part_id: "550e8400-e29b-41d4-a716-446655440100",
    quantity: 3,
    status: StockReservationStatus.RESERVED,
    failure_code: null,
    failure_reason: null,
    released_by_event_id: null,
    released_at: null,
    created_at: new Date("2024-01-03T00:00:00.000Z"),
    updated_at: new Date("2024-01-04T00:00:00.000Z"),
    ...overrides,
  } as StockReservationOrmEntity;
}
