import { IsOptional, IsString, IsEmail, IsIn, IsBoolean, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  // Primary phone stored in DB as 'phone'
  @IsOptional()
  @Matches(/^\d{10,15}$/, { message: 'phone must be 10–15 digits' })
  phone?: string;

  // Some UIs send 'mobile' — accept and map in service
  @IsOptional()
  @Matches(/^\d{10,15}$/, { message: 'mobile must be 10–15 digits' })
  mobile?: string;

  @IsOptional()
  @Matches(/^\d{10,15}$/, { message: 'alternateMobile must be 10–15 digits' })
  alternateMobile?: string;

  @IsOptional() @IsIn(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  // Accepts 'YYYY-MM-DD' or 'dd/MM/yyyy'
  @IsOptional() @IsString()
  dateOfBirth?: string;

  @IsOptional() @IsString()
  role?: string;

  @IsOptional() @IsBoolean()
  status?: boolean;

  @IsOptional() @IsString()
  profilePicture?: string;

  // Needed because other modules call updateUser({ token })
  @IsOptional()
  token?: string | null;
}
