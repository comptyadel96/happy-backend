import { Controller, Get, Patch, Body, UseGuards, Request, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Get('level/:levelId')
  async getLevelData(@Param('levelId') levelId: string) {
    return this.gameService.getLevelData(parseInt(levelId));
  }

  @Patch('sync')
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
