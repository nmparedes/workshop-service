import { DomainException } from "../../../common/exceptions/domain.exception";

export class PartAlreadyExistsException extends DomainException {
  constructor(code: string) {
    super("PART_ALREADY_EXISTS", "Part already exists.", { code });
  }
}
