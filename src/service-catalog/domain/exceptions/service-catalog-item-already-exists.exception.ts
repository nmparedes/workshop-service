import { DomainException } from "../../../common/exceptions/domain.exception";

export class ServiceCatalogItemAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(
      "SERVICE_CATALOG_ITEM_ALREADY_EXISTS",
      "Service catalog item already exists.",
      { name },
    );
  }
}
