import { DomainException } from "../../../common/exceptions/domain.exception";

export class EstimatedTimeInvalidException extends DomainException {
  constructor(estimatedMinutes: number) {
    super(
      "SERVICE_CATALOG_ESTIMATED_TIME_INVALID",
      "Estimated time must be greater than zero.",
      { estimatedMinutes },
    );
  }
}
