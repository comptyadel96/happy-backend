import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterAdultDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  physicalAddress?: string;
}
