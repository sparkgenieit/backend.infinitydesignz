import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserOrderDto {
  @IsEmail()
  email!: string;
  
  @IsOptional()
  @IsString()
  subscribedAt?: string; // maps to subscribed_at
}
