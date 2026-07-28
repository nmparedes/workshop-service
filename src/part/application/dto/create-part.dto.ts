import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const PART_UNITS = ["UN", "L", "KG", "M", "PAR", "CX", "PCT"] as const;
export type PartUnit = (typeof PART_UNITS)[number];

export class CreatePartDto {
  @ApiProperty({
    description: "Part code.",
    example: "OIL-123",
    pattern: "^[A-Z]{2,5}-\\d{3,6}$",
  })
  @IsString()
  @Matches(/^[A-Z]{2,5}-\d{3,6}$/)
  code: string;

  @ApiProperty({
    description: "Part name.",
    example: "Engine oil 5W30",
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "Part description.",
    example: "High quality synthetic engine oil.",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: "Part unit price.",
    example: 45.99,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  unitPrice: number;

  @ApiProperty({
    description: "Available stock quantity.",
    example: 100,
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  availableQuantity: number;

  @ApiProperty({
    description: "Minimum stock quantity.",
    example: 10,
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  minimumQuantity: number;

  @ApiProperty({
    description: "Measurement unit.",
    example: "L",
    enum: PART_UNITS,
  })
  @IsString()
  @IsIn(PART_UNITS)
  unit: PartUnit;
}
