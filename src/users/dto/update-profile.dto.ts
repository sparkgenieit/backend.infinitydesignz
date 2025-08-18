import { IsOptional, IsString, IsEmail, IsIn, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  // primary mobile -> maps to User.phone
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { message: 'mobile must be 10–15 digits' })
  mobile?: string;

  // maps to User.alternateMobile
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { message: 'alternateMobile must be 10–15 digits' })
  alternateMobile?: string;

  // maps to User.gender (enum Gender)
  @IsOptional() @IsIn(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  /**
   * Accepts ISO (YYYY-MM-DD) or dd/MM/yyyy (07/06/1992)
   */
  @IsOptional() @IsString()
  dateOfBirth?: string;
}
