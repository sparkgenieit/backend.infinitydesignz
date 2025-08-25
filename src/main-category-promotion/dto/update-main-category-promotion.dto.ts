import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateMainCategoryPromotionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_count?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'boolean'
      ? value
      : value === 'true' || value === '1' || value === 1
  )
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  image_url?: string | null;
}
