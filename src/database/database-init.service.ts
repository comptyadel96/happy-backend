import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for initializing database with essential data on startup
 * Ensures that all required seed data exists without needing manual seed execution
 */
@Injectable()
export class DatabaseInitService {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(private prisma: PrismaService) {}

  async initializeDatabase() {
    try {
      this.logger.log('🌱 Initializing database with seed data...');
      await this.seedLevelData();
      this.logger.log('✅ Database initialization completed successfully');
    } catch (error) {
      this.logger.error('❌ Database initialization failed:', error);
      // Don't throw - allow app to start even if seed fails
      // This prevents production crashes if seed encounters issues
    }
  }

  private async seedLevelData() {
    const levels = [
      {
        levelId: 1,
        levelName: 'Garden Adventure',
        maxChocolates: 30,
        maxEggs: 20,
        totalElements: 50,
        difficulty: 'easy',
      },
      {
        levelId: 2,
        levelName: 'Forest Quest',
        maxChocolates: 35,
        maxEggs: 25,
        totalElements: 60,
        difficulty: 'medium',
      },
      {
        levelId: 3,
        levelName: 'Mountain Challenge',
        maxChocolates: 40,
        maxEggs: 30,
        totalElements: 70,
        difficulty: 'hard',
      },
      {
        levelId: 4,
        levelName: 'Sky Journey',
        maxChocolates: 30,
        maxEggs: 25,
        totalElements: 55,
        difficulty: 'medium',
      },
      {
        levelId: 5,
        levelName: 'Ocean Mystery',
        maxChocolates: 35,
        maxEggs: 30,
        totalElements: 65,
        difficulty: 'hard',
      },
    ];

    const existingLevels = await this.prisma.levelData.findMany();

    if (existingLevels.length === 0) {
      this.logger.log(`📝 Creating ${levels.length} level configurations...`);
      for (const level of levels) {
        await this.prisma.levelData.create({
          data: level,
        });
        this.logger.debug(`  ✅ Created level: ${level.levelName} (ID: ${level.levelId})`);
      }
      this.logger.log(`✅ All ${levels.length} levels created successfully`);
    } else {
      this.logger.debug(
        `📊 Found ${existingLevels.length} existing level(s), skipping creation`,
      );
    }
  }
}
