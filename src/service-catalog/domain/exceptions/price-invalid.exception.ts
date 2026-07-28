import { DomainException } from "../../../common/exceptions/domain.exception";

export class PriceInvalidException extends DomainException {
  constructor(price: number) {
    super("SERVICE_CATALOG_PRICE_INVALID", "Price must be at least 0.01.", {
      price,
    });
  }
}
