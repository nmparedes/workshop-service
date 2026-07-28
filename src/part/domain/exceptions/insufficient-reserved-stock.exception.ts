import { DomainException } from "../../../common/exceptions/domain.exception";

export class InsufficientReservedStockException extends DomainException {
  constructor(reserved: number, requested: number) {
    super(
      "PART_RESERVED_STOCK_INSUFFICIENT",
      "Reserved stock is insufficient.",
      {
        reserved,
        requested,
      },
    );
  }
}
