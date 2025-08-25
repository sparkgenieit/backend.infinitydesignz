// REPLACE (new file)
import { Module } from '@nestjs/common';
import { MainProductPromotionService } from './main-product-promotion.service';
import { MainProductPromotionController } from './main-product-promotion.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MainProductPromotionController],
  providers: [MainProductPromotionService, PrismaService],
})
export class MainProductPromotionModule {}
