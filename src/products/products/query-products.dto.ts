import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryProductsDto {
  // search & brand
  @IsOptional() @IsString()
  searchStr?: string;

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  brandId?: number;

  // category hierarchy
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  mainCategoryId?: number;

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  subCategoryId?: number;

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  listSubCatId?: number;

  // price
  @IsOptional() @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  minPrice?: number;

  @IsOptional() @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  maxPrice?: number;

  // ✅ NEW: CSV params
  // e.g. color=Red,Blue  -> ['Red','Blue']
  @IsOptional()
  @Transform(({ value }) =>
    value ? String(value).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined
  )
  @IsString({ each: true })
  color?: string[];

  // e.g. size=L,XL -> ['L','XL']
  @IsOptional()
  @Transform(({ value }) =>
    value ? String(value).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined
  )
  @IsString({ each: true })
  size?: string[];

  // e.g. filterListIds=12,33 -> [12, 33]
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? String(value).split(',').map((s: string) => parseInt(s, 10)).filter((n) => !isNaN(n))
      : undefined
  )
  @IsInt({ each: true })
  filterListIds?: number[];

  // Back-compat: if someone still sends JSON here, we’ll fall back to it
  @IsOptional() @IsString()
  filters?: string;

  // sort & pagination
  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc';

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  @IsInt() @Min(1)
  pageSize?: number;
}
