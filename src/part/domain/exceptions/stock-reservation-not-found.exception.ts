import { DomainException } from "../../../common/exceptions/domain.exception";

export class StockReservationNotFoundException extends DomainException {
  constructor(sagaId: string, orderId: string, partId: string) {
    super("STOCK_RESERVATION_NOT_FOUND", "Stock reservation was not found.", {
      sagaId,
      orderId,
      partId,
    });
  }
}
