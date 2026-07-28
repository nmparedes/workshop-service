import { ApiProperty } from "@nestjs/swagger";

export class ServiceCatalogItemResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "Oil change" })
  name: string;

  @ApiProperty({ example: "Complete oil and oil filter replacement." })
  description: string;

  @ApiProperty({ example: 150, type: Number })
  price: number;

  @ApiProperty({ example: "R$ 150,00" })
  formattedPrice: string;

  @ApiProperty({ example: 90, type: Number })
  estimatedMinutes: number;

  @ApiProperty({ example: "1h 30min" })
  formattedEstimatedTime: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z", format: "date-time" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z", format: "date-time" })
  updatedAt: Date;
}
