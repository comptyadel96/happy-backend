import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Game')
@ApiBearerAuth('access-token')
@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current player game profile' })
  @ApiResponse({
    status: 200,
    description: 'Game profile retrieved successfully',
  })
  async getGameProfile(@Request() req) {
    return this.gameService.getGameProfile(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get player statistics (score, eggs, chocolates, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Player statistics retrieved successfully',
  })
  async getPlayerStats(@Request() req) {
    return this.gameService.getPlayerStats(req.user.userId);
  }

  @Get('level/:levelId')
  @ApiOperation({ summary: 'Get level data and constraints' })
  @ApiResponse({
    status: 200,
    description: 'Level data retrieved successfully',
  })
  async getLevelData(@Param('levelId') levelId: string) {
    return this.gameService.getLevelData(parseInt(levelId));
  }

  @Patch('sync')
  @ApiOperation({ summary: 'Sync entire game state (offline to online)' })
  @ApiResponse({
    status: 200,
    description: 'Game state synced successfully',
  })
  async syncGameState(
    @Request() req,
    @Body()
    syncData: {
      levelsData?: any;
      inventory?: any;
      missions?: any;
      achievements?: any;
      totalScore?: number;
      totalPlayTime?: number;
    },
  ) {
    return this.gameService.syncGameState(req.user.userId, syncData);
  }

  @Patch('item-collect')
  @ApiOperation({ summary: 'Collect item in level' })
  @ApiResponse({
    status: 200,
    description: 'Item collected successfully',
  })
  async collectItem(
    @Request() req,
    @Body()
    data: {
      levelId: number;
      itemType: 'chocolate' | 'egg';
      itemIndex: number;
    },
  ) {
    return this.gameService.handleItemCollection(req.user.userId, data);
  }

  @Patch('level-complete')
  @ApiOperation({ summary: 'Mark level as completed' })
  @ApiResponse({
    status: 200,
    description: 'Level completed successfully',
  })
  async completeLevel(
    @Request() req,
    @Body()
    data: {
      levelId: number;
      score: number;
      timeSpent: number;
    },
  ) {
    return this.gameService.handleLevelComplete(req.user.userId, data);
  }
}
