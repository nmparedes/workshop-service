import { StockReservation } from "../entities/stock-reservation.entity";

export interface StockReservationRepository {
  save(reservation: StockReservation): Promise<StockReservation>;
  findBySagaIdOrderIdPartId(
    sagaId: string,
    orderId: string,
    partId: string,
  ): Promise<StockReservation | null>;
}
