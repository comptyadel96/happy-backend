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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile and game status' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update game profile settings' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
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
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({
    status: 200,
    description: 'Activity logs retrieved successfully',
  })
  async getActivityLogs(@Request() req, @Query('limit') limit?: string) {
    return this.usersService.getUserActivityLogs(
      req.user.userId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('parent-contact')
  @ApiOperation({ summary: 'Create parent contact' })
  @ApiResponse({
    status: 201,
    description: 'Parent contact created successfully',
  })
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
  @ApiOperation({ summary: 'Verify parent contact with code' })
  @ApiResponse({
    status: 200,
    description: 'Parent contact verified successfully',
  })
  async verifyParentContact(
    @Param('contactId') contactId: string,
    @Body('verificationCode') verificationCode: string,
  ) {
    return this.usersService.verifyParentContact(contactId, verificationCode);
  }

  @Post('play-token/generate')
  @ApiOperation({ summary: 'Generate play token for child' })
  @ApiResponse({
    status: 200,
    description: 'Play token generated successfully',
  })
  async generatePlayToken(@Request() req) {
    return {
      token: await this.usersService.generatePlayToken(req.user.userId),
    };
  }

  @Post('play-token/verify')
  @ApiOperation({ summary: 'Verify play token as child' })
  @ApiResponse({
    status: 200,
    description: 'Play token verified successfully',
  })
  async verifyPlayToken(@Request() req, @Body('token') token: string) {
    return this.usersService.verifyChildWithToken(req.user.userId, token);
  }

  @Post('deactivate')
  @ApiOperation({ summary: 'Deactivate account' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deactivateAccount(@Request() req) {
    return this.usersService.deactivateAccount(req.user.userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
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
