
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMainProductPromotionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  priority?: number;

  @IsString() @MaxLength(100)
  displayPosition!: string;

  @IsString()
  imageUrl!: string;

  // 🔁 single category like Product
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  brandId?: number;

  @IsOptional() @IsString()
  seller?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  offerPercentFrom?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  offerPercentTo?: number;

  @IsOptional() @IsString() @MaxLength(255)
  seoTitle?: string;

  @IsOptional() @IsString()
  seoDescription?: string;

  @IsOptional() @IsString()
  seoKeywords?: string;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  status?: boolean;
}
