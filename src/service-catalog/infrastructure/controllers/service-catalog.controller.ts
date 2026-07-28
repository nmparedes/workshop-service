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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { PaginatedResponse } from "../../../common/interfaces/paginated-response.interface";
import { CreateServiceCatalogItemDto } from "../../application/dto/create-service-catalog-item.dto";
import { ServiceCatalogItemListResponseDto } from "../../application/dto/service-catalog-item-list-response.dto";
import { ServiceCatalogItemQueryDto } from "../../application/dto/service-catalog-item-query.dto";
import { ServiceCatalogItemResponseDto } from "../../application/dto/service-catalog-item-response.dto";
import { UpdateServiceCatalogItemDto } from "../../application/dto/update-service-catalog-item.dto";
import { ServiceCatalogService } from "../../application/services/service-catalog.service";

@ApiTags("service-catalog")
@ApiBearerAuth()
@Controller("service-catalog")
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Post()
  @ApiOperation({ summary: "Create a service catalog item." })
  @ApiCreatedResponse({ type: ServiceCatalogItemResponseDto })
  create(
    @Body() dto: CreateServiceCatalogItemDto,
  ): Promise<ServiceCatalogItemResponseDto> {
    return this.serviceCatalogService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "List service catalog items with filters and pagination.",
  })
  @ApiOkResponse({ type: ServiceCatalogItemListResponseDto })
  findAll(
    @Query() query: ServiceCatalogItemQueryDto,
  ): Promise<PaginatedResponse<ServiceCatalogItemResponseDto>> {
    return this.serviceCatalogService.findAll(query);
  }

  @Get("name/:name")
  @ApiOperation({ summary: "Find a service catalog item by name." })
  @ApiParam({ name: "name", description: "Service catalog item name." })
  @ApiOkResponse({ type: ServiceCatalogItemResponseDto })
  findByName(
    @Param("name") name: string,
  ): Promise<ServiceCatalogItemResponseDto> {
    return this.serviceCatalogService.findByName(name);
  }

  @Get(":id")
  @ApiOperation({ summary: "Find a service catalog item by ID." })
  @ApiParam({ name: "id", description: "Service catalog item ID." })
  @ApiOkResponse({ type: ServiceCatalogItemResponseDto })
  findById(@Param("id") id: string): Promise<ServiceCatalogItemResponseDto> {
    return this.serviceCatalogService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a service catalog item." })
  @ApiParam({ name: "id", description: "Service catalog item ID." })
  @ApiOkResponse({ type: ServiceCatalogItemResponseDto })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateServiceCatalogItemDto,
  ): Promise<ServiceCatalogItemResponseDto> {
    return this.serviceCatalogService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deactivate a service catalog item." })
  @ApiParam({ name: "id", description: "Service catalog item ID." })
  @ApiNoContentResponse({ description: "Service catalog item deactivated." })
  delete(@Param("id") id: string): Promise<void> {
    return this.serviceCatalogService.delete(id);
  }
}
