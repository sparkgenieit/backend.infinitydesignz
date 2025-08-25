import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetFacetsDto {
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  categoryId?: number; // optional

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  brandId?: number; // optional

  @IsOptional() @IsString()
  q?: string; // optional search

  @IsOptional() @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @IsOptional() @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  // default: hide empties when categoryId present, show empties when absent
  @IsOptional()
  @Transform(({ value }) => ['1', 'true', 'yes'].includes(String(value).toLowerCase()))
  @IsBoolean()
  showEmpty?: boolean;
}
