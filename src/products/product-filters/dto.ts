import { IsInt } from 'class-validator';

export class CreateProductfiltersDto {
  @IsInt()
  productId: number;

  @IsInt()
  filterListId: number;
}
