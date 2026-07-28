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

export class ServiceCatalogItemQueryDto {
  @ApiPropertyOptional({
    description: "Filter by partial service name.",
    example: "oil",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Minimum price.",
    example: 100,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: "Maximum price.",
    example: 200,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: "Minimum estimated time in minutes.",
    example: 30,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minEstimatedMinutes?: number;

  @ApiPropertyOptional({
    description: "Maximum estimated time in minutes.",
    example: 120,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxEstimatedMinutes?: number;

  @ApiPropertyOptional({
    description: "Filter by active flag.",
    example: true,
    type: Boolean,
  })
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
    enum: ["name", "price", "estimatedMinutes", "createdAt"],
    default: "createdAt",
  })
  @IsOptional()
  @IsIn(["name", "price", "estimatedMinutes", "createdAt"])
  orderBy?: "name" | "price" | "estimatedMinutes" | "createdAt";

  @ApiPropertyOptional({
    description: "Sort direction.",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  order?: "ASC" | "DESC";
}
