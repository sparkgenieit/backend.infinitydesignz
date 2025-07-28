import { Module } from '@nestjs/common';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { VariantsController } from './variants/variants.controller';
import { VariantsService } from './variants/variants.service';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';

import { ProductFiltersController } from './product-filters/product-filters.controller';
import { ProductFiltersService } from './product-filters/product-filters.service';
import { ProductFeaturesController } from './product-features/product-features.controller';
import { ProductFeaturesService } from './product-features/product-features.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [
    ProductsController,
    VariantsController,
    ImagesController,
    ProductFiltersController,
    ProductFeaturesController
  ],
  providers: [
    ProductsService,
    VariantsService,
    ImagesService,
    ProductFiltersService,
    PrismaService,
    ProductFeaturesService
  ],
})
export class ProductsModule {}
