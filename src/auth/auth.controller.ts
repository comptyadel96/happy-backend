import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST: Register a new account
   * Supports both adult (≥18) and child (<18) registration with age-based validation
   * Adults require: email, password, fullName, age, phone (personal), physicalAddress
   * Children require: email, password, fullName, age, phone (parent's), parentName, parentEmail
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new account (Adult or Child)',
    description:
      'Create a new user account. Automatically detects account type based on age:\n\n' +
      '**Adults (age ≥ 18) require:**\n' +
      '- email, password, fullName, age\n' +
      '- phone (personal phone number)\n' +
      '- physicalAddress\n\n' +
      '**Children (age < 18) require:**\n' +
      '- email, password, fullName, age\n' +
      '- phone (parent\'s phone number)\n' +
      '- parentName, parentEmail\n\n' +
      'Password must be at least 8 characters. Email must be unique.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: RegisterDto,
    description: 'Registration request - fields depend on age',
    examples: {
      adultsExample: {
        summary: 'Adult registration (age ≥ 18)',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePassword123!',
          fullName: 'John Doe',
          age: 35,
          phone: '+1234567890',
          physicalAddress: '123 Main St, City, Country',
        },
      },
      childExample: {
        summary: 'Child registration (age < 18)',
        value: {
          email: 'jane.smith@example.com',
          password: 'SecurePassword123!',
          fullName: 'Jane Smith',
          age: 14,
          phone: '+1987654321',
          parentName: 'Mary Smith',
          parentEmail: 'mary.smith@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account successfully created with JWT token',
    schema: {
      example: {
        user: {
          id: 'user_65f8a2b1c3d4e5f6g7h8i9j0',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          age: 35,
          role: 'ADULT',
          isAdult: true,
          createdAt: '2026-02-27T10:30:00Z',
        },
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        message: 'Account created successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - check error message for details',
    schema: {
      example: {
        message: 'Validation failed',
        errors: ['Password must be at least 8 characters'],
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
    schema: {
      example: {
        message: 'Email already in use',
        statusCode: 409,
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST: Login to existing account
   * Returns JWT token valid for 7 days
   * Token is used in Authorization header for all protected routes
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login to account',
    description:
      'Authenticate user with email and password. Returns JWT token with 7-day expiration. ' +
      'Use this token in Authorization header (Bearer <token>) for all protected endpoints.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
    examples: {
      example1: {
        summary: 'Valid login',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated - JWT token returned',
    schema: {
      example: {
        user: {
          id: 'user_65f8a2b1c3d4e5f6g7h8i9j0',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          role: 'ADULT',
          age: 35,
          isAdult: true,
        },
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiresIn: '7d',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: {
      example: {
        message: 'Invalid credentials',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        message: 'User not found',
        statusCode: 404,
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
