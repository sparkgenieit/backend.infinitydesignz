import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateSliderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

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
