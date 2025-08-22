import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateKeywordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyword!: string;
}
