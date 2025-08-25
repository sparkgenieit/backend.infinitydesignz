import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSliderDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  link?: string;

  @Type(() => Number)
  @IsInt()
  priority: number;

  @Transform(({ value }) =>
    typeof value === 'boolean'
      ? value
      : value === 'true' || value === '1' || value === 1
  )
  @IsBoolean()
  status: boolean;
}
