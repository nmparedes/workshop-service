import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class StockMovementDto {
  @ApiProperty({
    description: "Stock movement quantity.",
    example: 10,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: "Movement reason or note.",
    example: "Purchase invoice 12345",
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
