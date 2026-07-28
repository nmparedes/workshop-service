import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateServiceCatalogItemDto {
  @ApiProperty({
    description: "Service catalog item name.",
    example: "Oil change",
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "Service catalog item description.",
    example: "Complete oil and oil filter replacement.",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: "Service price.",
    example: 150,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  price: number;

  @ApiProperty({
    description: "Estimated execution time in minutes.",
    example: 90,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  estimatedMinutes: number;
}
