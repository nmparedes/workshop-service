import { Controller, Get, Param } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "../../../auth/decorators/public.decorator";
import { PartService } from "../../application/services/part.service";

type InternalPartResponse = {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  availableQuantity: number;
  active: boolean;
};

@Public()
@ApiExcludeController()
@Controller("internal/parts")
export class InternalPartController {
  constructor(private readonly partService: PartService) {}

  @Get(":id")
  async findById(@Param("id") id: string): Promise<InternalPartResponse> {
    const part = await this.partService.findById(id);

    return {
      id: part.id,
      code: part.code,
      name: part.name,
      unitPrice: part.unitPrice,
      availableQuantity: part.availableQuantity,
      active: part.active,
    };
  }
}
