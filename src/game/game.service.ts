import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CollectItemPayload {
  levelId: number;
  itemType: 'chocolate' | 'egg';
  itemIndex: number;
}

interface LevelCompletePayload {
  levelId: number;
  score: number;
  timeSpent: number;
}

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  // Get level data configuration
  async getLevelData(levelId: number) {
    return this.prisma.levelData.findUnique({
      where: { levelId },
    });
  }

  // Validate item collection against level constraints
  async validateItemCollection(userId: string, payload: CollectItemPayload) {
    const levelData = await this.getLevelData(payload.levelId);

    if (!levelData) {
      return { valid: false, error: 'Level not found' };
    }

    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      return { valid: false, error: 'Game profile not found' };
    }

    const levelsData = gameProfile.levelsData as any;
    const levelProgress = levelsData[`level_${payload.levelId}`] || {
      chocolatesTaken: [],
      eggsTaken: [],
    };

    // Validate against maximum limits
    const maxItems =
      payload.itemType === 'chocolate'
        ? levelData.maxChocolates
        : levelData.maxEggs;

    const currentArray =
      payload.itemType === 'chocolate'
        ? levelProgress.chocolatesTaken
        : levelProgress.eggsTaken;

    if (currentArray.includes(payload.itemIndex)) {
      return { valid: false, error: 'Item already collected' };
    }

    if (currentArray.length >= maxItems) {
      return {
        valid: false,
        error: `Maximum ${payload.itemType}s collected for this level`,
      };
    }

    if (payload.itemIndex >= maxItems) {
      return {
        valid: false,
        error: `Item index exceeds maximum for this level`,
      };
    }

    return { valid: true };
  }

  // Handle item collection
  async handleItemCollection(userId: string, payload: CollectItemPayload) {
    const validation = await this.validateItemCollection(userId, payload);

    if (!validation.valid) {
      return validation;
    }

    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    const levelsData = (gameProfile?.levelsData as any) || {};
    const levelKey = `level_${payload.levelId}`;

    if (!levelsData[levelKey]) {
      levelsData[levelKey] = {
        chocolatesTaken: [],
        eggsTaken: [],
        completed: false,
      };
    }

    if (payload.itemType === 'chocolate') {
      levelsData[levelKey].chocolatesTaken.push(payload.itemIndex);
    } else {
      levelsData[levelKey].eggsTaken.push(payload.itemIndex);
    }

    // Update game profile
    await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsData,
        totalPlayTime: (gameProfile?.totalPlayTime || 0) + 1,
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
        },
      },
    });

    return {
      valid: true,
      message: 'Item collected successfully',
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

    const levelsData = (gameProfile.levelsData as any) || {};
    const levelKey = `level_${payload.levelId}`;

    if (levelsData[levelKey]) {
      levelsData[levelKey].completed = true;
      levelsData[levelKey].score = payload.score;
      levelsData[levelKey].timeSpent = payload.timeSpent;
    }

    const newTotalScore = gameProfile.totalScore + payload.score;

    // Update game profile
    const updated = await this.prisma.gameProfile.update({
      where: { userId },
      data: {
        levelsData,
        totalScore: newTotalScore,
        currentLevel: Math.max(gameProfile.currentLevel, payload.levelId + 1),
        totalPlayTime: gameProfile.totalPlayTime + payload.timeSpent,
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
    if (syncData.totalScore) {
      updateData.totalScore = syncData.totalScore;
    }
    if (syncData.totalPlayTime) {
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
        details: syncData,
      },
    });

    return {
      success: true,
      message: 'Game state synced successfully',
      gameProfile: updated,
    };
  }
}
