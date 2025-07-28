import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean, Min } from 'class-validator'
import { CouponType, PriceType } from '@prisma/client'
import { Type } from 'class-transformer'

export class CreateCouponDto {
  @IsString()
  code: string

  @IsEnum(CouponType)
  type: CouponType

  @IsEnum(PriceType)
  priceType: PriceType

  @IsNumber()
  @Min(0)
  value: number

  @IsNumber()
  @Min(0)
  minOrderAmount: number

  @Type(() => Date)
  fromDate: Date

  @Type(() => Date)
  toDate: Date
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  status: boolean = true; //  Default true

  @IsOptional() menuId?: number
  @IsOptional() subMenuId?: number
  @IsOptional() listSubMenuId?: number
  @IsOptional() brandId?: number
  @IsOptional() sellerId?: number
  @IsOptional() priceId?: number
  @IsOptional() url?: string
}