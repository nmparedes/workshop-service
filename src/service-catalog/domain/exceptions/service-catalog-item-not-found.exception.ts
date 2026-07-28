import { DomainException } from "../../../common/exceptions/domain.exception";

export class ServiceCatalogItemNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      "SERVICE_CATALOG_ITEM_NOT_FOUND",
      "Service catalog item was not found.",
      { identifier },
    );
  }
}
