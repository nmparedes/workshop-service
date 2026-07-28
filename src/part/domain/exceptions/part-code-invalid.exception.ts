import { DomainException } from "../../../common/exceptions/domain.exception";

export class PartCodeInvalidException extends DomainException {
  constructor(code: string, reason: string) {
    super("PART_CODE_INVALID", "Part code is invalid.", { code, reason });
  }
}
