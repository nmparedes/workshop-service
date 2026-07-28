import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ExecutionQueryDto } from "../../application/dto/execution-query.dto";
import { ExecutionResponseDto } from "../../application/dto/execution-response.dto";
import { FailExecutionDto } from "../../application/dto/fail-execution.dto";
import { ExecutionService } from "../../application/services/execution.service";

@ApiTags("executions")
@ApiBearerAuth()
@Controller("executions")
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get()
  @ApiOperation({
    summary: "List execution queue entries or executions filtered by status.",
  })
  @ApiOkResponse({ type: [ExecutionResponseDto] })
  findAll(@Query() query: ExecutionQueryDto): Promise<ExecutionResponseDto[]> {
    return this.executionService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Find an execution by ID." })
  @ApiParam({ name: "id", description: "Execution ID." })
  @ApiOkResponse({ type: ExecutionResponseDto })
  findById(@Param("id") id: string): Promise<ExecutionResponseDto> {
    return this.executionService.findById(id);
  }

  @Post(":id/start-diagnosis")
  @ApiOperation({ summary: "Move an execution from queued to diagnosis." })
  @ApiParam({ name: "id", description: "Execution ID." })
  @ApiOkResponse({ type: ExecutionResponseDto })
  startDiagnosis(@Param("id") id: string): Promise<ExecutionResponseDto> {
    return this.executionService.startDiagnosis(id);
  }

  @Post(":id/start-repair")
  @ApiOperation({ summary: "Move an execution from diagnosis to repair." })
  @ApiParam({ name: "id", description: "Execution ID." })
  @ApiOkResponse({ type: ExecutionResponseDto })
  startRepair(@Param("id") id: string): Promise<ExecutionResponseDto> {
    return this.executionService.startRepair(id);
  }

  @Post(":id/finish")
  @ApiOperation({ summary: "Finish an execution." })
  @ApiParam({ name: "id", description: "Execution ID." })
  @ApiOkResponse({ type: ExecutionResponseDto })
  finish(@Param("id") id: string): Promise<ExecutionResponseDto> {
    return this.executionService.finish(id);
  }

  @Post(":id/fail")
  @ApiOperation({ summary: "Fail an execution with a business failure code." })
  @ApiParam({ name: "id", description: "Execution ID." })
  @ApiBody({ type: FailExecutionDto })
  @ApiOkResponse({ type: ExecutionResponseDto })
  fail(
    @Param("id") id: string,
    @Body() dto: FailExecutionDto,
  ): Promise<ExecutionResponseDto> {
    return this.executionService.fail(id, dto);
  }
}
