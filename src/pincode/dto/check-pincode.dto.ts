import { IsString, Length, Matches } from 'class-validator';

export class CheckPincodeDto {
  @IsString()
  @Length(6, 6, { message: 'Pincode must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Pincode must be numeric' })
  pincode!: string;
}
