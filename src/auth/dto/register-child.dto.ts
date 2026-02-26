import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterChildDto {
  @ApiProperty({ example: 'child@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ChildPassword123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Alice Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 10, description: 'Age of the child (must be under 16)' })
  @IsNumber()
  @Min(1)
  @Max(15)
  age: number;

  @ApiProperty({ example: '+33612345678', description: 'Phone number of the parent' })
  @IsString()
  parentPhone: string;

  @ApiProperty({ example: 'parent@example.com', description: 'Email of the parent' })
  @IsEmail()
  parentEmail: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the parent' })
  @IsString()
  parentName: string;

  @IsOptional()
  @IsString()
  parentContactId?: string;
}
