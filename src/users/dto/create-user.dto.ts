import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  // For strict validation per country you can switch to: @IsPhoneNumber('IN')
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsString()
  token?: string | null;

  // Fields your controller already reads (optional)
  @IsOptional() @IsString() profilePicture?: string;
  @IsOptional() @IsString() alternateMobile?: string;
  @IsOptional() @IsString() gender?: string;       // 'Male' | 'Female' | 'Other' (normalized in controller)
  @IsOptional() @IsString() role?: string;         // normalized in controller
  @IsOptional() @IsString() dateOfBirth?: string;  // ISO or dd/MM/yyyy (parsed in controller)
  @IsOptional() @IsBoolean() status?: boolean;
}