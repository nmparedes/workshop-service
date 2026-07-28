import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class FailExecutionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  failureCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}
