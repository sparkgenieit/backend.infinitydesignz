import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePriceRangeDto {
  @IsString()
  label: string;

  @IsInt()
  @Min(0)
  min: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  max?: number;
}