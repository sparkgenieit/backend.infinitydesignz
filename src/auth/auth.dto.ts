import { Expose } from "class-transformer";
import { IsMobilePhone, IsNotEmpty } from "class-validator";

export class AuthBaseRequestDto {
  @IsMobilePhone("en-IN")
  mobileNumber: string;
}

export class LoginRequestDto extends AuthBaseRequestDto {}
export class RegisterRequestDto extends AuthBaseRequestDto {}
export class AuthRequestDto extends AuthBaseRequestDto {}
export class ResendOtpRequestDto extends AuthBaseRequestDto {}

export class VerifyOtpRequestDto extends AuthBaseRequestDto {
  @IsNotEmpty()
  otp: number;

  expoPushToken: string | null;
}

export class VerifyOtpResponseDto {
  access_token: string;
}

export class ProfileResponseDto {
  @IsNotEmpty()
  @Expose()
  id: number;

  @IsNotEmpty()
  @Expose()
  mobileNumber: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  gender: number;

  @Expose()
  weight: number;

  @Expose()
  height: number;

  @Expose()
  stepLength: number;

  @Expose()
  profilePictureUrl: string;

  @Expose()
  onBoardingCompleted: boolean;
}

export class ProfileUpdateRequestDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: number;
  weight?: number;
  height?: number;
  stepLength?: number;
  profilePictureUrl?: string;
  onBoardingCompleted?: boolean;
}
