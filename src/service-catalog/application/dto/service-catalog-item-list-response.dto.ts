import { ApiProperty } from "@nestjs/swagger";
import { ServiceCatalogItemResponseDto } from "./service-catalog-item-response.dto";

export class ServiceCatalogItemListMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class ServiceCatalogItemListResponseDto {
  @ApiProperty({ type: [ServiceCatalogItemResponseDto] })
  data: ServiceCatalogItemResponseDto[];

  @ApiProperty({ type: ServiceCatalogItemListMetaDto })
  meta: ServiceCatalogItemListMetaDto;
}
