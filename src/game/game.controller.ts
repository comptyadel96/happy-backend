import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
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
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollectItemDto } from './dto/collect-item.dto';
import { CompleteLevelDto } from './dto/complete-level.dto';
import { SyncGameStateDto } from './dto/sync-game-state.dto';
import { SubmitLevelDataDto, LevelDataDto } from './dto/level-data.dto';

@ApiTags('Game')
@ApiBearerAuth('access-token')
@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  /**
   * Retrieve the complete game profile for the authenticated player
   * Returns all levelsData, inventory, missions, achievements, and player settings
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get current player game profile',
    description:
      'Retrieves the complete game profile including all levels progress, inventory, missions, achievements, and player settings for the authenticated user.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Game profile retrieved successfully',
    schema: {
      example: {
        success: true,
        gameProfile: {
          userId: 'user-123',
          currentLevel: 5,
          totalScore: 15000,
          totalPlayTime: 3600,
          language: 'en',
          soundEnabled: true,
          musicEnabled: true,
          levelsData: {
            level_1: {
              chocolatesTaken: [0, 1, 2],
              eggsTaken: [0],
              completed: true,
            },
          },
          lastPlayedAt: '2026-02-27T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async getGameProfile(@Request() req) {
    return this.gameService.getGameProfile(req.user.userId);
  }

  /**
   * Retrieve aggregated player statistics
   * Calculates totals for scores, eggs, chocolates, playtime, and level completion
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get player statistics (score, eggs, chocolates, etc.)',
    description:
      'Calculates and returns aggregated player statistics including total score, total playtime, current level, completed levels count, total chocolates collected, and total eggs collected.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Player statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        stats: {
          totalScore: 15000,
          totalPlayTime: 3600,
          currentLevel: 5,
          completedLevels: 4,
          totalChocolates: 42,
          totalEggs: 15,
          language: 'en',
          soundEnabled: true,
          musicEnabled: true,
          lastPlayedAt: '2026-02-27T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async getPlayerStats(@Request() req) {
    return this.gameService.getPlayerStats(req.user.userId);
  }

  /**
   * Retrieve configuration and constraints for a specific level
   * Returns max items, difficulty, duration, rewards, etc.
   */
  @Get('level/:levelId')
  @ApiOperation({
    summary: 'Get level data and constraints',
    description:
      'Retrieves the configuration for a specific level including constraints, item limits, difficulty, rewards, and other level-specific settings.',
  })
  @ApiParam({
    name: 'levelId',
    type: Number,
    description: 'The ID of the level to retrieve',
    example: 1,
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Level data retrieved successfully',
    schema: {
      example: {
        levelId: 1,
        difficulty: 'easy',
        maxChocolates: 5,
        maxEggs: 3,
        timeLimit: 120,
        baseReward: 500,
        description: 'The first level of the adventure',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Level not found',
  })
  async getLevelData(@Param('levelId') levelId: string) {
    return this.gameService.getLevelData(parseInt(levelId));
  }

  /**
   * PATCH: Collect an item (chocolate or egg) in a level
   * Validates collection constraints and updates player progress
   *
   * Key validations:
   * - Item index must be within level constraints
   * - Cannot collect the same item twice
   * - Cannot exceed max items per level
   * - Level must exist in game data
   */
  @Patch('item-collect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect item in level (chocolate or egg)',
    description:
      'Records the collection of an item (chocolate or egg) at a specific location in a level. ' +
      'Validates that the item exists, has not been collected before, and respects level constraints. ' +
      'Updates player progress and game statistics.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: CollectItemDto,
    description: 'Item collection request',
    examples: {
      chocolate: {
        summary: 'Collect a chocolate',
        value: {
          levelId: 1,
          itemType: 'chocolate',
          itemIndex: 0,
        },
      },
      egg: {
        summary: 'Collect an egg',
        value: {
          levelId: 1,
          itemType: 'egg',
          itemIndex: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Item collected successfully',
    schema: {
      example: {
        valid: true,
        message: 'Item collected successfully',
        levelProgress: {
          chocolatesTaken: [0, 1, 2],
          eggsTaken: [0],
          completed: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - Item already collected or limits exceeded',
    schema: {
      example: {
        valid: false,
        error: 'Item already collected',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Level not found in game data',
  })
  async collectItem(@Request() req, @Body() data: CollectItemDto) {
    return this.gameService.handleItemCollection(req.user.userId, data);
  }

  /**
   * PATCH: Mark a level as completed
   * Records completion with score and playtime, updates progression
   */
  @Patch('level-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark level as completed',
    description:
      'Records the completion of a level with the score achieved and time spent. ' +
      'Updates player progression, total score, and playtime statistics. ' +
      'May trigger new level unlocks or achievement checks.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: CompleteLevelDto,
    description: 'Level completion request',
    examples: {
      example1: {
        summary: 'Complete level 1 with full score',
        value: {
          levelId: 1,
          score: 2500,
          timeSpent: 45,
        },
      },
      example2: {
        summary: 'Complete level 2 with partial score',
        value: {
          levelId: 2,
          score: 1800,
          timeSpent: 120,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Level marked as completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Level completed successfully',
        newStats: {
          totalScore: 17500,
          totalPlayTime: 3645,
          currentLevel: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile or level not found',
  })
  async completeLevel(@Request() req, @Body() data: CompleteLevelDto) {
    return this.gameService.handleLevelComplete(req.user.userId, data);
  }

  /**
   * PATCH: Synchronize entire game state
   * Used for offline-to-online sync or full state restoration
   * Merges or overwrites player data based on timestamps
   */
  @Patch('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync entire game state (offline to online)',
    description:
      'Synchronizes the complete game state from the client to the server. ' +
      'Used primarily for offline play sync, allowing players to resume offline progress online. ' +
      'Validates all data before merging with server state. ' +
      'Fields are optional - only provided fields will be updated.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: SyncGameStateDto,
    description: 'Game state synchronization request - all fields optional',
    examples: {
      fullSync: {
        summary: 'Full game state sync',
        value: {
          levelsData: {
            level_1: {
              chocolatesTaken: [0, 1, 2],
              eggsTaken: [0],
              completed: true,
            },
            level_2: {
              chocolatesTaken: [],
              eggsTaken: [],
              completed: false,
            },
          },
          inventory: {
            weapons: [],
            potions: [],
          },
          missions: {},
          achievements: {},
          totalScore: 15000,
          totalPlayTime: 3600,
        },
      },
      partialSync: {
        summary: 'Partial sync (only score and playtime)',
        value: {
          totalScore: 20000,
          totalPlayTime: 5400,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Game state synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Game state synced successfully',
        syncedAt: '2026-02-27T10:35:00Z',
        updatedFields: ['levelsData', 'totalScore', 'totalPlayTime'],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid sync data format or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncGameState(@Request() req, @Body() syncData: SyncGameStateDto) {
    return this.gameService.syncGameState(req.user.userId, syncData);
  }

  /**
   * POST: Submit level data from Godot game
   * Records complete level progress sent from the game client
   */
  @Post('level/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit level data from Godot game',
    description:
      'Records complete level progress data sent from the Godot game client. ' +
      'Includes collected items, score, time, happy letters, and other level-specific data. ' +
      'Updates player progression and total score.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: LevelDataDto,
    description: 'Complete level data from Godot',
    examples: {
      example1: {
        summary: 'Level 1 completed with full collection',
        value: {
          levelId: 1,
          chokolata_collected: 30,
          eggs_collected: 2,
          diamond_collected: 2,
          time: 120,
          score: 8500,
          chokolate_taked: [true, true, true],
          eggs_taked: [true, true],
          diamonds_taked: [true, true],
          level_won: true,
          level_unlocked: true,
          player_position_name: '',
          happy_letters: {
            H: true,
            A: false,
            P: false,
            P2: false,
            Y: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Level data submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'Level data submitted successfully',
        levelId: 1,
        totalScore: 8500,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid level data format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async submitLevelData(@Request() req, @Body() levelData: LevelDataDto) {
    return this.gameService.submitLevelData(req.user.userId, levelData);
  }

  /**
   * PATCH: Sync levels inventory
   * Items available and taken per level
   */
  @Patch('levels/inventory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync levels inventory data',
    description:
      'Synchronizes inventory data for all levels. ' +
      'Tracks which items are available (have) and which have been taken in each level.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Levels inventory data',
    examples: {
      example1: {
        summary: 'Inventory for levels 2, 3, 5, 6',
        value: {
          2: {
            have: { key: false, family_image: false },
            taked: { key: false, family_image: false },
          },
          3: {
            have: { lever: false },
            taked: { lever: false },
          },
          5: {
            have: { key: false, tshirt: false, hat: false },
            taked: { key: false, tshirt: false, hat: false },
          },
          6: {
            have: { mask: false },
            taked: { mask: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Levels inventory synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Levels inventory synced',
        levelsInventory: {},
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncLevelsInventory(@Request() req, @Body() levelsInventory: any) {
    return this.gameService.syncLevelsInventory(
      req.user.userId,
      levelsInventory,
    );
  }

  /**
   * PATCH: Sync levels states
   * Tracks which states/triggers have been activated per level
   */
  @Patch('levels/states')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync levels states (triggers, doors, etc)',
    description:
      'Synchronizes state data for all levels. ' +
      'Tracks which doors, levers, platforms, and other triggers have been activated.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Levels states data',
    examples: {
      example1: {
        summary: 'States for levels 1-6',
        value: {
          1: { BarnDoor: false, CaveFarmDoor: false },
          2: { LeverElectricity: false },
          3: { LeverRight: false, LeverStock: false, PlatformDoor: false },
          4: { LeverLeft: false, LeverCenter: false },
          5: { BasmentDoor: false, HouseDoor: false, Faza3a: false },
          6: { CaveCompleted: false },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Levels states synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Levels states synced',
        levelsStates: {},
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncLevelsStates(@Request() req, @Body() levelsStates: any) {
    return this.gameService.syncLevelsStates(req.user.userId, levelsStates);
  }

  /**
   * PATCH: Sync levels missions
   * Tracks mission progress per level
   */
  @Patch('levels/missions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync levels missions data',
    description:
      'Synchronizes mission data for all levels. ' +
      'Tracks which missions are completed in each level.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Levels missions data',
    examples: {
      example1: {
        summary: 'Missions for level 1',
        value: {
          1: { StrangerImage: false },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Levels missions synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Levels missions synced',
        levelsMissions: {},
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncLevelsMissions(@Request() req, @Body() levelsMissions: any) {
    return this.gameService.syncLevelsMissions(req.user.userId, levelsMissions);
  }

  /**
   * PATCH: Sync game options
   * Language, difficulty, accessibility settings
   */
  @Patch('options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync game options',
    description:
      'Synchronizes game options like language, sound, music, and other settings. ' +
      'Updates player preferences across all sessions.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Game options',
    examples: {
      example1: {
        summary: 'Game options',
        value: {
          first_time_play: true,
          happy_map_position: 1,
          language: 'ar',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Game options synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Game options synced',
        gameOptions: {},
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncGameOptions(@Request() req, @Body() gameOptions: any) {
    return this.gameService.syncGameOptions(req.user.userId, gameOptions);
  }

  /**
   * PATCH: Sync game data
   * Hints, skills, and other game data
   */
  @Patch('data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync game data (hints, skills, etc)',
    description:
      'Synchronizes game data like hint visibility and skill unlocks. ' +
      'Tracks gameplay progression and feature unlocks.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    description: 'Game data',
    examples: {
      example1: {
        summary: 'Game data with hints and skills',
        value: {
          movment_hint_show: true,
          ledder_hint_show: true,
          use_hint_show: true,
          hang_hint_show: true,
          attack_skill: false,
          climb_skill: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Game data synced successfully',
    schema: {
      example: {
        success: true,
        message: 'Game data synced',
        gameData: {},
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async syncGameData(@Request() req, @Body() gameData: any) {
    return this.gameService.syncGameData(req.user.userId, gameData);
  }

  /**
   * GET: Get complete game state
   * Returns all game state data for Godot client
   */
  @Get('state')
  @ApiOperation({
    summary: 'Get complete game state for Godot',
    description:
      'Retrieves the complete game state for the Godot game client. ' +
      'Includes all levels data, inventory, states, missions, options, and game data.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Complete game state retrieved successfully',
    schema: {
      example: {
        success: true,
        gameState: {
          levelsData: {},
          levelsInventory: {},
          levelsStates: {},
          levelsMissions: {},
          gameOptions: {},
          gameData: {},
          currentLevel: 1,
          totalScore: 0,
          totalPlayTime: 0,
          lastSyncAt: '2026-02-27T10:35:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Game profile not found for this user',
  })
  async getCompleteGameState(@Request() req) {
    return this.gameService.getCompleteGameState(req.user.userId);
  }
}
