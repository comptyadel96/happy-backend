import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class RegisterChildDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  fullName: string;

  @IsNumber()
  @Min(1)
  @Max(15)
  age: number;

  @IsOptional()
  @IsString()
  parentContactId?: string;
}
