import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export type OrderItemModerationStatus = 'APPROVED' | 'CANCELLED';
export type OrderItemUserRequestStatus = 'CANCEL_REQUESTED';

export class UpdateOrderItemDto {
  @IsIn(['APPROVED', 'CANCELLED'])
  status!: OrderItemModerationStatus;

  @IsInt()
  @Min(1)
  orderId!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RequestCancelItemDto {
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
