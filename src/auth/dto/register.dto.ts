import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email unique' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 25,
    description: 'Age (1-120)',
  })
  @IsNumber()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({
    example: '+33612345678',
    description: 'Phone number (personal if 18+, parent phone if under 18)',
    required: false,
  })
  @ValidateIf((o: RegisterDto) => true)
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'John Parent',
    description: 'Parent name (required if under 18)',
    required: false,
  })
  @ValidateIf((o: RegisterDto) => o.age < 18)
  @IsString()
  parentName?: string;

  @ApiProperty({
    example: 'parent@example.com',
    description: 'Parent email (required if under 18)',
    required: false,
  })
  @ValidateIf((o: RegisterDto) => o.age < 18)
  @IsEmail()
  parentEmail?: string;

  @ApiProperty({
    example: '123 Rue de la Paix, 75000 Paris',
    description: 'Physical address (required if 18+)',
    required: false,
  })
  @ValidateIf((o: RegisterDto) => o.age >= 18)
  @IsString()
  physicalAddress?: string;
}
