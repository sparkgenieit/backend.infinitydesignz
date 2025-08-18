import { IsInt, IsOptional, Min } from "class-validator";

export class CreateBuyNowDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
