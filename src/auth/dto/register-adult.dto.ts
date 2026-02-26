import { IsEmail, IsString, MinLength, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdultDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 35, description: 'Age of the adult' })
  @IsNumber()
  @Min(18)
  @Max(120)
  age: number;

  @ApiProperty({ example: '+33612345678', description: 'Phone number of the adult' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Rue de la Paix, 75000 Paris', description: 'Physical address' })
  @IsString()
  physicalAddress: string;
}
