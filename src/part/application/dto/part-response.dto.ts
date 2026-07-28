import { ApiProperty } from "@nestjs/swagger";

export class PartResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "OIL-123" })
  code: string;

  @ApiProperty({ example: "Engine oil 5W30" })
  name: string;

  @ApiProperty({ example: "High quality synthetic engine oil." })
  description: string;

  @ApiProperty({ example: 45.99, type: Number })
  unitPrice: number;

  @ApiProperty({ example: "R$ 45,99" })
  formattedUnitPrice: string;

  @ApiProperty({ example: 100, type: Number })
  availableQuantity: number;

  @ApiProperty({ example: 20, type: Number })
  reservedQuantity: number;

  @ApiProperty({ example: 120, type: Number })
  totalQuantity: number;

  @ApiProperty({ example: 10, type: Number })
  minimumQuantity: number;

  @ApiProperty({ example: false, type: Boolean })
  belowMinimumStock: boolean;

  @ApiProperty({ example: true, type: Boolean })
  hasAvailableStock: boolean;

  @ApiProperty({ example: "L" })
  unit: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z", format: "date-time" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z", format: "date-time" })
  updatedAt: Date;
}
