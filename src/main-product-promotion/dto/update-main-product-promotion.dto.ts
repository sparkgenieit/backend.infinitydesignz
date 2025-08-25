import { PartialType } from '@nestjs/mapped-types';
import { CreateMainProductPromotionDto } from './create-main-product-promotion.dto';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMainProductPromotionDto extends PartialType(CreateMainProductPromotionDto) {
  // make categoryId optional for PATCH
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryId?: number;
}