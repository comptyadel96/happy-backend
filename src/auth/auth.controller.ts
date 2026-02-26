import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account (Adult or Child)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Account successfully created',
    schema: {
      example: {
        user: {
          id: 'user_id',
          email: 'user@example.com',
          fullName: 'John Doe',
          age: 35,
          role: 'ADULT',
          isAdult: true,
          createdAt: '2026-02-26T00:00:00Z',
        },
        token: 'jwt_token_here',
        message: 'Account created successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid age' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to account' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    schema: {
      example: {
        user: {
          id: 'user_id',
          email: 'user@example.com',
          fullName: 'John Doe',
          role: 'ADULT',
        },
        token: 'jwt_token_here',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
