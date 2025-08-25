import { Controller, Get, Query,Post, Body, Param, Put, Delete,  UseGuards,
BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductsDto, UpdateProductsDto, } from './dto';
import { QueryProductsDto } from './query-products.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

 

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
@UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProductsDto) {
    return this.productsService.create(dto);
  }
@UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

@Get('search')
async searchProducts(@Query() query: QueryProductsDto) {
  return this.productsService.searchProducts(query);
}
  
 @Get('details')
  async getProductDetails(
    @Query('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    if (!productId) throw new BadRequestException('productId is required');
    return this.productsService.getProductDetails(
      parseInt(productId),
      variantId ? parseInt(variantId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }
@UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductsDto) {
    return this.productsService.update(+id, dto);
  }
@UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

 
}