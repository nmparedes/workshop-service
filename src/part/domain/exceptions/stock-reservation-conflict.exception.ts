import { DomainException } from "../../../common/exceptions/domain.exception";

export class StockReservationConflictException extends DomainException {
  constructor(
    sagaId: string,
    orderId: string,
    partId: string,
    expectedQuantity: number,
    receivedQuantity: number,
  ) {
    super(
      "STOCK_RESERVATION_CONFLICT",
      "Stock reservation already exists with a different quantity.",
      {
        sagaId,
        orderId,
        partId,
        expectedQuantity,
        receivedQuantity,
      },
    );
  }
}
