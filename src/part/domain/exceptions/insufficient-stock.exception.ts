import { DomainException } from "../../../common/exceptions/domain.exception";

export class InsufficientStockException extends DomainException {
  constructor(available: number, requested: number) {
    super("PART_STOCK_INSUFFICIENT", "Available stock is insufficient.", {
      available,
      requested,
    });
  }
}
