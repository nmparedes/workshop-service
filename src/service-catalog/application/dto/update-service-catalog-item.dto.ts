import { PartialType } from "@nestjs/swagger";
import { CreateServiceCatalogItemDto } from "./create-service-catalog-item.dto";

export class UpdateServiceCatalogItemDto extends PartialType(
  CreateServiceCatalogItemDto,
) {}
