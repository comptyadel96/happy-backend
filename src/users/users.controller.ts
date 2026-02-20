import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body()
    updateData: {
      language?: string;
      soundEnabled?: boolean;
      musicEnabled?: boolean;
      contentRestriction?: string;
    },
  ) {
    return this.usersService.updateGameProfile(req.user.userId, updateData);
  }

  @Get('activity-logs')
  async getActivityLogs(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserActivityLogs(
      req.user.userId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('parent-contact')
  async createParentContact(
    @Body()
    parentData: {
      parentName: string;
      parentPhone: string;
      parentEmail: string;
    },
  ) {
    return this.usersService.createParentContact(parentData);
  }

  @Post('verify-parent/:contactId')
  async verifyParentContact(
    @Param('contactId') contactId: string,
    @Body('verificationCode') verificationCode: string,
  ) {
    return this.usersService.verifyParentContact(contactId, verificationCode);
  }

  @Post('play-token/generate')
  async generatePlayToken(@Request() req) {
    return {
      token: await this.usersService.generatePlayToken(req.user.userId),
    };
  }

  @Post('play-token/verify')
  async verifyPlayToken(
    @Request() req,
    @Body('token') token: string,
  ) {
    return this.usersService.verifyChildWithToken(req.user.userId, token);
  }

  @Post('deactivate')
  async deactivateAccount(@Request() req) {
    return this.usersService.deactivateAccount(req.user.userId);
  }

  @Get('all')
  async getAllUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.usersService.getAllUsers(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 10,
    );
  }
}
