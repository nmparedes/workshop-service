import { StockReservation } from "../../domain/entities/stock-reservation.entity";
import { StockReservationOrmEntity } from "../typeorm/stock-reservation.orm-entity";

export class StockReservationMapper {
  static toDomain(ormEntity: StockReservationOrmEntity): StockReservation {
    return StockReservation.restore({
      id: ormEntity.id,
      sagaId: ormEntity.saga_id,
      orderId: ormEntity.order_id,
      partId: ormEntity.part_id,
      quantity: ormEntity.quantity,
      status: ormEntity.status,
      failureCode: ormEntity.failure_code,
      failureReason: ormEntity.failure_reason,
      releasedByEventId: ormEntity.released_by_event_id,
      releasedAt: ormEntity.released_at,
      createdAt: ormEntity.created_at,
      updatedAt: ormEntity.updated_at,
    });
  }

  static toOrmEntity(reservation: StockReservation): StockReservationOrmEntity {
    const ormEntity = new StockReservationOrmEntity();

    ormEntity.id = reservation.id;
    ormEntity.saga_id = reservation.sagaId;
    ormEntity.order_id = reservation.orderId;
    ormEntity.part_id = reservation.partId;
    ormEntity.quantity = reservation.quantity;
    ormEntity.status = reservation.status;
    ormEntity.failure_code = reservation.failureCode;
    ormEntity.failure_reason = reservation.failureReason;
    ormEntity.released_by_event_id = reservation.releasedByEventId;
    ormEntity.released_at = reservation.releasedAt;
    ormEntity.created_at = reservation.createdAt;
    ormEntity.updated_at = reservation.updatedAt;

    return ormEntity;
  }
}
