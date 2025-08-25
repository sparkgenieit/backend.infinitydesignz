import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class CreateOrderItemDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number | null;

  @IsInt()
  quantity: number;

  // per-unit price
  @IsNumber()
  price: number;

  // line total (quantity * price)
  @IsNumber()
  total: number;
}

export class CreateOrderDto {
  @IsInt()
  addressId: number;

  @IsOptional()
  @IsInt()
  couponId?: number;

  @IsString()
  paymentMethod: string; // e.g. "COD"

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  shippingFee: number;

  @IsNumber()
  gst: number;

  @IsNumber()
  totalAmount: number;

  // IMPORTANT: these ensure ValidationPipe keeps `items` and validates it
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
