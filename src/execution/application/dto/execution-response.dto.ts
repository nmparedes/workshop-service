import { ApiProperty } from "@nestjs/swagger";
import { ExecutionStatus } from "../../domain/enums/execution-status.enum";

export class ExecutionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sagaId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ nullable: true, required: false })
  requestEventId: string | null;

  @ApiProperty({ nullable: true, required: false })
  correlationId: string | null;

  @ApiProperty({ enum: ExecutionStatus })
  status: ExecutionStatus;

  @ApiProperty({ nullable: true, required: false })
  failureCode: string | null;

  @ApiProperty({ nullable: true, required: false })
  failureReason: string | null;

  @ApiProperty()
  queuedAt: Date;

  @ApiProperty({ nullable: true, required: false })
  diagnosisStartedAt: Date | null;

  @ApiProperty({ nullable: true, required: false })
  repairStartedAt: Date | null;

  @ApiProperty({ nullable: true, required: false })
  finishedAt: Date | null;

  @ApiProperty({ nullable: true, required: false })
  failedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
