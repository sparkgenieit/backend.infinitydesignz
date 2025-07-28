import { Module } from '@nestjs/common';
import { ProductFiltersService } from './product-filters.service';
import { ProductFiltersController } from './product-filters.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ProductFiltersController],
  providers: [ProductFiltersService, PrismaService],
})
export class ProductfiltersModule {}