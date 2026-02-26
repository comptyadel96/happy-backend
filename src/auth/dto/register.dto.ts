import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email unique' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (min 6 chars for children, 8 for adults)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 35,
    description: 'Age (18+ for adults, 1-15 for children)',
  })
  @IsNumber()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({
    example: true,
    description: 'Is adult? (true = adult account, false = child account)',
  })
  @IsBoolean()
  isAdult: boolean;

  // Adult fields (required if isAdult = true)
  @ApiProperty({
    example: '+33612345678',
    description: 'Phone number (required for adults)',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '123 Rue de la Paix, 75000 Paris',
    description: 'Physical address (required for adults)',
    required: false,
  })
  @IsOptional()
  @IsString()
  physicalAddress?: string;

  // Child fields (required if isAdult = false)
  @ApiProperty({
    example: '+33612345678',
    description: 'Parent phone number (required for children)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiProperty({
    example: 'parent@example.com',
    description: 'Parent email (required for children)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Parent name (required for children)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentName?: string;
}
