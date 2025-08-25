import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class BuyNowDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  variantId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @Type(() => Number)
  @IsInt()
  addressId!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  couponId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  couponDiscount?: number; // final discount from UI; service already caps it
}
