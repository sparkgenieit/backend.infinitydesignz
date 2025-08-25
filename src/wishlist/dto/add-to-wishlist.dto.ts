import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class AddToWishlistDto {
  // Require productId if sku is NOT provided
  @ValidateIf(o => !o.sku)
  @IsInt()
  @Min(1)
  productId?: number;

  // Or allow sku if productId is NOT provided
  @ValidateIf(o => !o.productId)
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  variantId?: number;
}
