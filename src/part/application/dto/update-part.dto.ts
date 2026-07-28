import { OmitType, PartialType } from "@nestjs/swagger";
import { CreatePartDto } from "./create-part.dto";

export class UpdatePartDto extends PartialType(
  OmitType(CreatePartDto, ["code", "availableQuantity"] as const),
) {}
