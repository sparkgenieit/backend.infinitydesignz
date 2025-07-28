import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProductFeaturesService } from './product-features.service';
import { CreateProductFeatureDto } from './dto';

@Controller('product-features')
export class ProductFeaturesController {
  constructor(private readonly service: ProductFeaturesService) {}

  @Post()
  create(@Body() dtos: CreateProductFeatureDto[]) {
     return this.service.createOrUpdateMany(dtos); //  for array payload
  }

  @Get(':id')
  findByProduct(@Param('id') productId: string) {
    return this.service.findByProduct(+productId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateProductFeatureDto) {
    return this.service.update(+id, dto);
  }
}
