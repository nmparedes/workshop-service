import { Controller, Get, Param } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "../../../auth/decorators/public.decorator";
import { ServiceCatalogService } from "../../application/services/service-catalog.service";

type InternalServiceCatalogItemResponse = {
  id: string;
  name: string;
  unitPrice: number;
  active: boolean;
};

@Public()
@ApiExcludeController()
@Controller("internal/service-catalog/items")
export class InternalServiceCatalogController {
  constructor(
    private readonly serviceCatalogService: ServiceCatalogService,
  ) {}

  @Get(":id")
  async findById(
    @Param("id") id: string,
  ): Promise<InternalServiceCatalogItemResponse> {
    const item = await this.serviceCatalogService.findById(id);

    return {
      id: item.id,
      name: item.name,
      unitPrice: item.price,
      active: item.active,
    };
  }
}
