import { DomainException } from "../../../common/exceptions/domain.exception";

export class QuantityInvalidException extends DomainException {
  constructor(quantity: number, reason: string) {
    super("PART_QUANTITY_INVALID", "Part quantity is invalid.", {
      quantity,
      reason,
    });
  }
}
