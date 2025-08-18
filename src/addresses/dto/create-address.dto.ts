import { IsNotEmpty, IsString,IsOptional,IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  buildingName: string;

  @IsString()
  @IsNotEmpty()
  flatNumber: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  addressLine2: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsString()
  @IsNotEmpty()
  label: string; // Home / Office / Other

  @IsOptional()
  @IsBoolean()
  default?: boolean;
}
