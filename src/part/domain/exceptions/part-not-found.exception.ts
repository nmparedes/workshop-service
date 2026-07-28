import { DomainException } from "../../../common/exceptions/domain.exception";

export class PartNotFoundException extends DomainException {
  constructor(identifier: string) {
    super("PART_NOT_FOUND", "Part was not found.", { identifier });
  }
}
