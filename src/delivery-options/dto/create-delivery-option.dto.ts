import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDeliveryOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  fee: number;

  @IsString()
days: string;
}
