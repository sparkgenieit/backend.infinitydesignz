import { IsInt, Min } from "class-validator";

export class UpdateBuyNowDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
