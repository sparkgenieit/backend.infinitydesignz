import { Controller, Get, Query,Post, Body, Param, Put, Delete,  UseGuards,
BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductsDto, UpdateProductsDto } from './dto';
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

@Get('search') //  Now matches /products/search
  async searchProducts(
    @Query('mainCategoryId') mainCategoryId: string,
    @Query('subCategoryId') subCategoryId: string,
    @Query('listSubCatId') listSubCatId?: string,
    @Query('brandId') brandId?: string,
    @Query('searchStr') searchStr?: string,
    @Query('filters') filters?: string // JSON stringified
  ) {
    const parsed = {
      mainCategoryId:mainCategoryId ? parseInt(mainCategoryId): 0,
      subCategoryId: subCategoryId ? parseInt(subCategoryId) : 0,
      listSubCatId: listSubCatId ? parseInt(listSubCatId) : undefined,
      brandId: brandId ? parseInt(brandId) : undefined,
      searchStr,
      filters: filters || '{}', //  Avoid JSON parse error on undefined
    };

    if ( isNaN(parsed.subCategoryId)) {
      throw new BadRequestException('categoryId and subCategoryId are required');
    }

    return this.productsService.getProducts(parsed);
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
@UseGuards(JwtAuthGuard)
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