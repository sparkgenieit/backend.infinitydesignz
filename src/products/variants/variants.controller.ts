import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  BadRequestException,
} from "@nestjs/common";
import { VariantsService } from "./variants.service";
import { CreateVariantsDto, UpdateVariantsDto } from "./dto";

@Controller("variants")
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post(":productId")
  create(
    @Param("productId") productId: string,
    @Body() dto: CreateVariantsDto[]
  ) {
    if (!Array.isArray(dto)) {
      throw new BadRequestException(
        "❌ Please send an array of variant objects."
      );
    }
    return this.variantsService.create(Number(productId), dto);
  }
  @Get()
  findAll() {
    return this.variantsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.variantsService.findOne(+id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateVariantsDto) {
    return this.variantsService.update(+id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.variantsService.remove(+id);
  }
}
