import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { PaginatedResponse } from "../../../common/interfaces/paginated-response.interface";
import { CreatePartDto } from "../../application/dto/create-part.dto";
import { PartListResponseDto } from "../../application/dto/part-list-response.dto";
import { PartQueryDto } from "../../application/dto/part-query.dto";
import { PartResponseDto } from "../../application/dto/part-response.dto";
import { StockMovementDto } from "../../application/dto/stock-movement.dto";
import { UpdatePartDto } from "../../application/dto/update-part.dto";
import { PartService } from "../../application/services/part.service";

@ApiTags("parts")
@ApiBearerAuth()
@Controller("parts")
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post()
  @ApiOperation({ summary: "Create a part." })
  @ApiCreatedResponse({ type: PartResponseDto })
  create(@Body() dto: CreatePartDto): Promise<PartResponseDto> {
    return this.partService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List parts with filters and pagination." })
  @ApiOkResponse({ type: PartListResponseDto })
  findAll(
    @Query() query: PartQueryDto,
  ): Promise<PaginatedResponse<PartResponseDto>> {
    return this.partService.findAll(query);
  }

  @Get("below-minimum-stock")
  @ApiOperation({ summary: "List parts below minimum stock." })
  @ApiOkResponse({ type: [PartResponseDto] })
  findBelowMinimumStock(): Promise<PartResponseDto[]> {
    return this.partService.findBelowMinimumStock();
  }

  @Get("code/:code")
  @ApiOperation({ summary: "Find a part by code." })
  @ApiParam({ name: "code", description: "Part code." })
  @ApiOkResponse({ type: PartResponseDto })
  findByCode(@Param("code") code: string): Promise<PartResponseDto> {
    return this.partService.findByCode(code);
  }

  @Get(":id")
  @ApiOperation({ summary: "Find a part by ID." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiOkResponse({ type: PartResponseDto })
  findById(@Param("id") id: string): Promise<PartResponseDto> {
    return this.partService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a part." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiOkResponse({ type: PartResponseDto })
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePartDto,
  ): Promise<PartResponseDto> {
    return this.partService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deactivate a part." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiNoContentResponse({ description: "Part deactivated." })
  delete(@Param("id") id: string): Promise<void> {
    return this.partService.delete(id);
  }

  @Post(":id/stock/add")
  @ApiOperation({ summary: "Add available stock." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiBody({ type: StockMovementDto })
  @ApiOkResponse({ type: PartResponseDto })
  addStock(
    @Param("id") id: string,
    @Body() dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.partService.addStock(id, dto);
  }

  @Post(":id/stock/remove")
  @ApiOperation({ summary: "Remove available stock." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiBody({ type: StockMovementDto })
  @ApiOkResponse({ type: PartResponseDto })
  removeStock(
    @Param("id") id: string,
    @Body() dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.partService.removeStock(id, dto);
  }

  @Post(":id/stock/reserve")
  @ApiOperation({ summary: "Reserve stock." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiBody({ type: StockMovementDto })
  @ApiOkResponse({ type: PartResponseDto })
  reserveStock(
    @Param("id") id: string,
    @Body() dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.partService.reserveStock(id, dto);
  }

  @Post(":id/stock/release")
  @ApiOperation({ summary: "Release reserved stock." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiBody({ type: StockMovementDto })
  @ApiOkResponse({ type: PartResponseDto })
  releaseStock(
    @Param("id") id: string,
    @Body() dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.partService.releaseStock(id, dto);
  }

  @Post(":id/stock/commit-reserved")
  @ApiOperation({ summary: "Commit reserved stock." })
  @ApiParam({ name: "id", description: "Part ID." })
  @ApiBody({ type: StockMovementDto })
  @ApiOkResponse({ type: PartResponseDto })
  commitReservedStock(
    @Param("id") id: string,
    @Body() dto: StockMovementDto,
  ): Promise<PartResponseDto> {
    return this.partService.commitReservedStock(id, dto);
  }
}
