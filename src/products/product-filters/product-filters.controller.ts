import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProductFiltersService } from './product-filters.service';
import { CreateProductfiltersDto } from './dto';

@Controller('product-filters')
export class ProductFiltersController {
  constructor(private readonly productFiltersService: ProductFiltersService) {}

  

  @Post()
  createOrUpdateMany(@Body() dtos: CreateProductfiltersDto[]) {
    return this.productFiltersService.createOrUpdateMany(dtos);
  }

  @Get()
  findAll() {
    return this.productFiltersService.findAll();
  }

 @Get(':id')
  findByProduct(@Param('id') productId: string) {
    return this.productFiltersService.findByProduct(+productId);
  }
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.productFiltersService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productFiltersService.remove(+id);
  }
}
