import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAdultDto } from './dto/register-adult.dto';
import { RegisterChildDto } from './dto/register-child.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-adult')
  async registerAdult(@Body() registerAdultDto: RegisterAdultDto) {
    return this.authService.registerAdult(registerAdultDto);
  }

  @Post('register-child')
  async registerChild(@Body() registerChildDto: RegisterChildDto) {
    return this.authService.registerChild(registerChildDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
