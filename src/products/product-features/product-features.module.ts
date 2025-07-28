import { Module } from '@nestjs/common';
import { ProductFeaturesController } from './product-features.controller';
import { ProductFeaturesService } from './product-features.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ProductFeaturesController],
  providers: [ProductFeaturesService, PrismaService],
})
export class ProductFeaturesModule {}
