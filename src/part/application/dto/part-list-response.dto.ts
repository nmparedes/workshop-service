import { ApiProperty } from "@nestjs/swagger";
import { PartResponseDto } from "./part-response.dto";

export class PartListMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PartListResponseDto {
  @ApiProperty({ type: [PartResponseDto] })
  data: PartResponseDto[];

  @ApiProperty({ type: PartListMetaDto })
  meta: PartListMetaDto;
}
