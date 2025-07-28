
import { Module } from '@nestjs/common';
import { MainCategoryPromotionService } from './main-category-promotion.service';
import { MainCategoryPromotionController } from './main-category-promotion.controller';

@Module({
  controllers: [MainCategoryPromotionController],
  providers: [MainCategoryPromotionService],
})
export class MainCategoryPromotionModule {}
