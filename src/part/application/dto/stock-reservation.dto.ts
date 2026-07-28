import { StockReservationStatus } from "../../domain/enums/stock-reservation-status.enum";

export interface ReserveStockCommand {
  sagaId: string;
  orderId: string;
  partId: string;
  quantity: number;
}

export interface StockReservationCommandIdentity {
  sagaId: string;
  orderId: string;
  partId: string;
}

export interface StockReservationResultDto {
  id: string;
  sagaId: string;
  orderId: string;
  partId: string;
  quantity: number;
  status: StockReservationStatus;
  failureCode: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
