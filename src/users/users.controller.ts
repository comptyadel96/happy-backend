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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET: Retrieve the authenticated user's profile
   * Returns user data, age, role, and account status
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile and account information',
    description:
      'Retrieves the complete profile for the authenticated user including personal information, account status, and role.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 'user_65f8a2b1c3d4e5f6g7h8i9j0',
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        age: 35,
        role: 'ADULT',
        isAdult: true,
        phone: '+1234567890',
        physicalAddress: '123 Main St, City, Country',
        createdAt: '2026-02-26T10:30:00Z',
        updatedAt: '2026-02-27T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  /**
   * PATCH: Update user's game profile settings
   * Allows changing language, audio preferences, and content restrictions
   */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update game profile settings',
    description:
      'Update user preferences including language, sound and music settings, and content restrictions. All fields are optional.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Profile update request - all fields optional',
    schema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          example: 'en',
          description: 'Language code (en, fr, es, etc.)',
        },
        soundEnabled: {
          type: 'boolean',
          example: true,
          description: 'Enable or disable sound effects',
        },
        musicEnabled: {
          type: 'boolean',
          example: true,
          description: 'Enable or disable background music',
        },
        contentRestriction: {
          type: 'string',
          example: 'PG-13',
          description: 'Content restriction level',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile updated successfully',
        updatedFields: ['language', 'soundEnabled'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
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

  /**
   * GET: Retrieve user's activity history
   * Returns logs of game actions, level completions, items collected, etc.
   */
  @Get('activity-logs')
  @ApiOperation({
    summary: 'Get user activity logs',
    description:
      'Retrieve the activity history for the authenticated user. Includes game actions, level completions, item collections, and other interactions.',
  })
  @ApiProduces('application/json')
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of logs to return (default: 50)',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity logs retrieved successfully',
    schema: {
      example: {
        logs: [
          {
            id: 'log_1',
            userId: 'user_123',
            action: 'LEVEL_COMPLETED',
            details: { levelId: 1, score: 2500 },
            timestamp: '2026-02-27T10:30:00Z',
          },
          {
            id: 'log_2',
            userId: 'user_123',
            action: 'ITEM_COLLECTED',
            details: { levelId: 1, itemType: 'chocolate', itemIndex: 0 },
            timestamp: '2026-02-27T10:25:00Z',
          },
        ],
        total: 2,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getActivityLogs(@Request() req, @Query('limit') limit?: string) {
    return this.usersService.getUserActivityLogs(
      req.user.userId,
      limit ? parseInt(limit) : 50,
    );
  }

  /**
   * POST: Create parent contact information
   * Used when registering a child account
   */
  @Post('parent-contact')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or link parent contact information',
    description:
      'Register a parent contact for a child account. Sends verification code to parent email.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Parent contact information',
    schema: {
      type: 'object',
      required: ['parentName', 'parentPhone', 'parentEmail'],
      properties: {
        parentName: {
          type: 'string',
          example: 'Mary Smith',
          description: 'Full name of the parent',
        },
        parentPhone: {
          type: 'string',
          example: '+1987654321',
          description: 'Parent contact phone number',
        },
        parentEmail: {
          type: 'string',
          example: 'mary.smith@example.com',
          description: 'Parent email address (used for verification)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Parent contact created - verification email sent',
    schema: {
      example: {
        contactId: 'parent_contact_123',
        message: 'Verification code sent to parent email',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parent contact data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
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

  /**
   * POST: Verify parent contact with verification code
   * Parent must submit the code sent to their email
   */
  @Post('verify-parent/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify parent contact with code',
    description:
      'Complete parent verification by submitting the code sent to parent email address.',
  })
  @ApiParam({
    name: 'contactId',
    type: String,
    description: 'Parent contact ID',
    example: 'parent_contact_123',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Verification code from email',
    schema: {
      type: 'object',
      required: ['verificationCode'],
      properties: {
        verificationCode: {
          type: 'string',
          example: 'ABC123XYZ',
          description: 'Code received in parent email',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Parent contact verified successfully',
    schema: {
      example: {
        verified: true,
        message: 'Parent contact verified',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent contact not found',
  })
  async verifyParentContact(
    @Param('contactId') contactId: string,
    @Body('verificationCode') verificationCode: string,
  ) {
    return this.usersService.verifyParentContact(contactId, verificationCode);
  }

  /**
   * POST: Generate a play token for child
   * Parent uses this token to allow child to play
   */
  @Post('play-token/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate play token for child',
    description:
      'Create a temporary token allowing a child to play. Used for parental control and play session management.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 201,
    description: 'Play token generated successfully',
    schema: {
      example: {
        token: 'play_token_xyz789',
        expiresIn: 3600,
        message: 'Token valid for 1 hour',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Only parents can generate play tokens',
  })
  async generatePlayToken(@Request() req) {
    return {
      token: await this.usersService.generatePlayToken(req.user.userId),
    };
  }

  /**
   * POST: Verify play token as child
   * Child submits token to start playing session
   */
  @Post('play-token/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify and use play token as child',
    description:
      'Child verifies with a play token generated by parent to initiate play session.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Play token to verify',
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          example: 'play_token_xyz789',
          description: 'Token generated by parent',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Play token verified - session can start',
    schema: {
      example: {
        verified: true,
        message: 'Play token verified',
        sessionValidUntil: '2026-02-27T11:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired play token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async verifyPlayToken(@Request() req, @Body('token') token: string) {
    return this.usersService.verifyChildWithToken(req.user.userId, token);
  }

  /**
   * POST: Deactivate user account
   * This action is irreversible
   */
  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate account',
    description:
      'Permanently deactivate the user account. This action cannot be undone. All game progress will be archived.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
    schema: {
      example: {
        success: true,
        message: 'Account deactivated',
        deactivatedAt: '2026-02-27T10:35:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async deactivateAccount(@Request() req) {
    return this.usersService.deactivateAccount(req.user.userId);
  }

  /**
   * GET: List all users (admin endpoint)
   * Paginated list with skip and take parameters
   */
  @Get('all')
  @ApiOperation({
    summary: 'Get all users (admin only)',
    description:
      'Retrieve paginated list of all registered users. Admin endpoint - requires appropriate permissions.',
  })
  @ApiProduces('application/json')
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of users to skip (pagination offset)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of users to return (pagination limit)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    schema: {
      example: {
        users: [
          {
            id: 'user_123',
            email: 'john@example.com',
            fullName: 'John Doe',
            role: 'ADULT',
            createdAt: '2026-02-26T00:00:00Z',
          },
        ],
        total: 50,
        skip: 0,
        take: 10,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
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
