import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CollectItemPayload {
  levelId: number;
  itemType: 'chocolate' | 'egg' | 'diamond' | 'star' | 'coin';
  itemIndex: number;
  skipValidation?: boolean;
}

interface LevelCompletePayload {
  levelId: number;
  score: number;
  timeSpent: number;
}

// Default level constraints if LevelData doesn't exist
const DEFAULT_LEVEL_CONSTRAINTS = {
  chocolate: 30,
  egg: 20,
  diamond: 5,
  star: 10,
  coin: 100,
};

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  // Get game profile
  async getGameProfile(userId: string) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    return {
      success: true,
      gameProfile,
    };
  }

  // Get player statistics
  async getPlayerStats(userId: string) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const levelsData = gameProfile.levelsData as any;
    let totalChocolates = 0;
    let totalEggs = 0;
    let totalDiamonds = 0;
    let totalStars = 0;
    let totalCoins = 0;
    let completedLevels = 0;

    // Calculate totals from all levels
    Object.keys(levelsData).forEach((levelKey) => {
      const level = levelsData[levelKey];
      if (level.chocolatesTaken) {
        totalChocolates += level.chocolatesTaken.length;
      }
      if (level.eggsTaken) {
        totalEggs += level.eggsTaken.length;
      }
      if (level.diamondsTaken) {
        totalDiamonds += level.diamondsTaken.length;
      }
      if (level.starsTaken) {
        totalStars += level.starsTaken.length;
      }
      if (level.coinsTaken) {
        totalCoins += level.coinsTaken.length;
      }
      if (level.completed) {
        completedLevels += 1;
      }
    });

    return {
      success: true,
      stats: {
        totalScore: gameProfile.totalScore,
        totalPlayTime: gameProfile.totalPlayTime,
        currentLevel: gameProfile.currentLevel,
        completedLevels,
        totalChocolates,
        totalEggs,
        totalDiamonds,
        totalStars,
        totalCoins,
        language: gameProfile.language,
        soundEnabled: gameProfile.soundEnabled,
        musicEnabled: gameProfile.musicEnabled,
        lastPlayedAt: gameProfile.lastPlayedAt,
      },
    };
  }

  // Get level data configuration
  async getLevelData(levelId: number) {
    return this.prisma.levelData.findUnique({
      where: { levelId },
    });
  }

  // Validate item collection against level constraints
  async validateItemCollection(userId: string, payload: CollectItemPayload) {
    // Skip validation if requested (for offline mode)
    if (payload.skipValidation) {
      return { valid: true };
    }

    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { valid: false, error: 'Game profile not found' };
    }

    const levelsData = gameProfile.levelsData as any;
    const levelKey = `level_${payload.levelId}`;
    const levelProgress = levelsData[levelKey] || {
      chocolatesTaken: [],
      eggsTaken: [],
      diamondsTaken: [],
      starsTaken: [],
      coinsTaken: [],
    };

    // Try to get level-specific constraints from database
    let levelData = await this.getLevelData(payload.levelId);
    
    // In production, if level data is not found, return error
    // This ensures levels are properly configured before accepting collection
    if (!levelData) {
      return { valid: false, error: 'Level not found' };
    }

    const maxItems = payload.itemType === 'chocolate'
      ? levelData.maxChocolates
      : levelData.maxEggs;

    // Map item type to collected array
    const itemTypeMap = {
      chocolate: 'chocolatesTaken',
      egg: 'eggsTaken',
      diamond: 'diamondsTaken',
      star: 'starsTaken',
      coin: 'coinsTaken',
    };

    const arrayKey = itemTypeMap[payload.itemType];
    const currentArray = levelProgress[arrayKey] || [];

    // Check if item already collected
    if (currentArray.includes(payload.itemIndex)) {
      return { valid: false, error: 'Item already collected' };
    }

    // Check if within collection limit
    if (currentArray.length >= maxItems) {
      return {
        valid: false,
        error: `Maximum ${maxItems} ${payload.itemType}s can be collected in this level`,
      };
    }

    // Index validation is flexible - allow any non-negative index
    if (payload.itemIndex < 0) {
      return {
        valid: false,
        error: `Item index must be >= 0`,
      };
    }

    return { valid: true };
  }

  // Handle item collection
  async handleItemCollection(userId: string, payload: CollectItemPayload) {
    // Validate first
    const validation = await this.validateItemCollection(userId, payload);

    if (!validation.valid) {
      return validation;
    }

    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { valid: false, error: 'Game profile not found' };
    }

    const levelsData = (gameProfile.levelsData as any) || {};
    const levelKey = `level_${payload.levelId}`;

    // Initialize level progress if doesn't exist
    if (!levelsData[levelKey]) {
      levelsData[levelKey] = {
        chocolatesTaken: [],
        eggsTaken: [],
        diamondsTaken: [],
        starsTaken: [],
        coinsTaken: [],
        completed: false,
      };
    }

    // Map item type to array and add item
    const itemTypeMap = {
      chocolate: 'chocolatesTaken',
      egg: 'eggsTaken',
      diamond: 'diamondsTaken',
      star: 'starsTaken',
      coin: 'coinsTaken',
    };

    const arrayKey = itemTypeMap[payload.itemType];
    levelsData[levelKey][arrayKey].push(payload.itemIndex);

    // Calculate points for collected item (optional reward system)
    const itemPoints = {
      chocolate: 10,
      egg: 25,
      diamond: 100,
      star: 50,
      coin: 1,
    };

    const earnedPoints = itemPoints[payload.itemType] || 0;

    // Update game profile
    const updatedProfile = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsData,
        totalPlayTime: (gameProfile.totalPlayTime || 0) + 1,
        totalScore: (gameProfile.totalScore || 0) + earnedPoints,
        lastPlayedAt: new Date(),
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'ITEM_COLLECTED',
        details: {
          levelId: payload.levelId,
          itemType: payload.itemType,
          itemIndex: payload.itemIndex,
          earnedPoints,
          totalItems: levelsData[levelKey][arrayKey].length,
        },
      },
    });

    return {
      valid: true,
      message: 'Item collected successfully',
      earnedPoints,
      totalScore: updatedProfile.totalScore,
      levelProgress: levelsData[levelKey],
    };
  }

  // Handle level completion
  async handleLevelComplete(userId: string, payload: LevelCompletePayload) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    // Verify level exists in database
    const levelData = await this.getLevelData(payload.levelId);
    if (!levelData) {
      return { success: false, error: 'Level not found' };
    }

    const levelsData = (gameProfile.levelsData as any) || {};
    const levelKey = `level_${payload.levelId}`;

    // Initialize level if doesn't exist
    if (!levelsData[levelKey]) {
      levelsData[levelKey] = {
        chocolatesTaken: [],
        eggsTaken: [],
        diamondsTaken: [],
        starsTaken: [],
        coinsTaken: [],
        completed: false,
      };
    }

    // Mark level as completed
    levelsData[levelKey].completed = true;
    levelsData[levelKey].score = payload.score;
    levelsData[levelKey].timeSpent = payload.timeSpent;
    levelsData[levelKey].completedAt = new Date().toISOString();

    const newTotalScore = gameProfile.totalScore + payload.score;

    // Update game profile
    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsData,
        totalScore: newTotalScore,
        currentLevel: Math.max(gameProfile.currentLevel, payload.levelId + 1),
        totalPlayTime: gameProfile.totalPlayTime + payload.timeSpent,
        lastPlayedAt: new Date(),
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'LEVEL_COMPLETED',
        details: {
          levelId: payload.levelId,
          score: payload.score,
          timeSpent: payload.timeSpent,
        },
      },
    });

    return {
      success: true,
      message: 'Level completed successfully',
      totalScore: newTotalScore,
      gameProfile: updated,
    };
  }

  // Sync game state (for offline-to-online transition)
  async syncGameState(
    userId: string,
    syncData: {
      levelsData?: any;
      inventory?: any;
      missions?: any;
      achievements?: any;
      totalScore?: number;
      totalPlayTime?: number;
    },
  ) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updateData: any = {
      pendingSync: false,
      lastSyncAt: new Date(),
      lastPlayedAt: new Date(),
    };

    if (syncData.levelsData) {
      updateData.levelsData = syncData.levelsData;
    }
    if (syncData.inventory) {
      updateData.inventory = syncData.inventory;
    }
    if (syncData.missions) {
      updateData.missions = syncData.missions;
    }
    if (syncData.achievements) {
      updateData.achievements = syncData.achievements;
    }
    if (syncData.totalScore !== undefined) {
      updateData.totalScore = syncData.totalScore;
    }
    if (syncData.totalPlayTime !== undefined) {
      updateData.totalPlayTime = syncData.totalPlayTime;
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: updateData,
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'GAME_STATE_SYNCED',
        details: {
          fieldsUpdated: Object.keys(updateData),
          syncData,
        },
      },
    });

    return {
      success: true,
      message: 'Game state synced successfully',
      gameProfile: updated,
    };
  }

  // Submit level data from Godot game
  async submitLevelData(userId: string, levelData: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const levelId = levelData.levelId;
    const levelsData = (gameProfile.levelsData as any) || {};

    // Store complete level data from Godot
    levelsData[levelId] = {
      chokolata_collected: levelData.chokolata_collected,
      eggs_collected: levelData.eggs_collected,
      diamond_collected: levelData.diamond_collected,
      time: levelData.time,
      score: levelData.score,
      chokolate_taked_ids: levelData.chokolate_taked_ids,
      eggs_taked_ids: levelData.eggs_taked_ids,
      diamonds_taked_ids: levelData.diamonds_taked_ids,
      game_won: levelData.game_won,
      level_unlocked: levelData.level_unlocked,
      player_position_name: levelData.player_position_name,
      happy_letters: levelData.happy_letters,
      submittedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsData,
        totalScore: gameProfile.totalScore + levelData.score,
        totalPlayTime: gameProfile.totalPlayTime + levelData.time,
        currentLevel: Math.max(gameProfile.currentLevel, levelId + 1),
        lastPlayedAt: new Date(),
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'LEVEL_DATA_SUBMITTED',
        details: {
          levelId,
          score: levelData.score,
          time: levelData.time,
          game_won: levelData.game_won,
        },
      },
    });

    return {
      success: true,
      message: 'Level data submitted successfully',
      levelId,
      totalScore: updated.totalScore,
    };
  }

  // Sync levels inventory (items collected per level)
  async syncLevelsInventory(userId: string, levelsInventory: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsInventory,
        lastPlayedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Levels inventory synced',
      levelsInventory: updated.levelsInventory,
    };
  }

  // Sync levels states (triggers, doors, etc)
  async syncLevelsStates(userId: string, levelsStates: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsStates,
        lastPlayedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Levels states synced',
      levelsStates: updated.levelsStates,
    };
  }

  // Sync levels missions
  async syncLevelsMissions(userId: string, levelsMissions: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsMissions,
        lastPlayedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Levels missions synced',
      levelsMissions: updated.levelsMissions,
    };
  }

  // Sync game options
  async syncGameOptions(userId: string, gameOptions: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        gameOptions,
        lastPlayedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Game options synced',
      gameOptions: updated.gameOptions,
    };
  }

  // Sync game data (hints, skills, etc)
  async syncGameData(userId: string, gameData: any) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        gameData,
        lastPlayedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Game data synced',
      gameData: updated.gameData,
    };
  }

  // Get complete game state for Godot
  async getCompleteGameState(userId: string) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { success: false, error: 'Game profile not found' };
    }

    return {
      success: true,
      gameState: {
        levelsData: gameProfile.levelsData,
        levelsInventory: gameProfile.levelsInventory,
        levelsStates: gameProfile.levelsStates,
        levelsMissions: gameProfile.levelsMissions,
        gameOptions: gameProfile.gameOptions,
        gameData: gameProfile.gameData,
        currentLevel: gameProfile.currentLevel,
        totalScore: gameProfile.totalScore,
        totalPlayTime: gameProfile.totalPlayTime,
        lastSyncAt: gameProfile.lastSyncAt,
      },
    };
  }
}
