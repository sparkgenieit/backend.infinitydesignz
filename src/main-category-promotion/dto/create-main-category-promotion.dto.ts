import { IsBoolean, IsInt, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMainCategoryPromotionDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsInt()
  priority: number;

  @Type(() => Number)
  @IsInt()
  display_count: number;

  @Transform(({ value }) =>
    typeof value === 'boolean'
      ? value
      : value === 'true' || value === '1' || value === 1
  )
  @IsBoolean()
  status: boolean;
}
