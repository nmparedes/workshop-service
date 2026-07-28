import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PART_UNITS, PartUnit } from "./create-part.dto";

export class PartQueryDto {
  @ApiPropertyOptional({ description: "Filter by partial part code." })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: "Filter by partial part name." })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Minimum unit price.", minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum unit price.", minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: "Measurement unit.", enum: PART_UNITS })
  @IsOptional()
  @IsIn(PART_UNITS)
  unit?: PartUnit;

  @ApiPropertyOptional({ description: "Only parts below minimum stock." })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  onlyBelowMinimumStock?: boolean;

  @ApiPropertyOptional({ description: "Only parts with available stock." })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  onlyWithStock?: boolean;

  @ApiPropertyOptional({ description: "Filter by active flag." })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: "Page number.", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Page size.", default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: "Sort field.",
    enum: ["code", "name", "unitPrice", "availableQuantity", "createdAt"],
    default: "createdAt",
  })
  @IsOptional()
  @IsIn(["code", "name", "unitPrice", "availableQuantity", "createdAt"])
  orderBy?: "code" | "name" | "unitPrice" | "availableQuantity" | "createdAt";

  @ApiPropertyOptional({
    description: "Sort direction.",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  order?: "ASC" | "DESC";
}
