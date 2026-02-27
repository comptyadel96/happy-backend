// game.controller.spec.ts - Comprehensive Item Collection Tests

import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { CollectItemDto } from './dto/collect-item.dto';
import { CompleteLevelDto } from './dto/complete-level.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('GameController - Item Collection (v2)', () => {
  let controller: GameController;
  let service: GameService;

  const mockGameService = {
    validateItemCollection: jest.fn(),
    handleItemCollection: jest.fn(),
    validateLevelComplete: jest.fn(),
    handleLevelComplete: jest.fn(),
    getPlayerStats: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'test-user-123', username: 'testplayer' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .compile();

    controller = module.get<GameController>(GameController);
    service = module.get<GameService>(GameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collectItem - All Item Types', () => {
    it('should collect chocolate successfully', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'chocolate',
        itemIndex: 0,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected successfully',
        earnedPoints: 10,
        totalScore: 1010,
        levelProgress: { chocolatesTaken: [0] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.earnedPoints).toBe(10);
      expect(result.totalScore).toBe(1010);
      expect(mockGameService.handleItemCollection).toHaveBeenCalledWith(
        mockRequest.user.id,
        collectDto,
      );
    });

    it('should collect egg with 25 points', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'egg',
        itemIndex: 0,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected successfully',
        earnedPoints: 25,
        totalScore: 1025,
        levelProgress: { eggsTaken: [0] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.earnedPoints).toBe(25);
      expect(result.totalScore).toBe(1025);
    });

    it('should collect diamond with 100 points (NEW)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'diamond',
        itemIndex: 0,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected successfully',
        earnedPoints: 100,
        totalScore: 1100,
        levelProgress: { diamondsTaken: [0] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.earnedPoints).toBe(100);
      expect(result.totalScore).toBe(1100);
      expect(result.levelProgress.diamondsTaken).toContain(0);
    });

    it('should collect star with 50 points (NEW)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'star',
        itemIndex: 1,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected successfully',
        earnedPoints: 50,
        totalScore: 1050,
        levelProgress: { starsTaken: [1] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.earnedPoints).toBe(50);
      expect(result.totalScore).toBe(1050);
    });

    it('should collect coin with 1 point (NEW)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 2,
        itemType: 'coin',
        itemIndex: 5,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected successfully',
        earnedPoints: 1,
        totalScore: 2001,
        levelProgress: { coinsTaken: [5] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.earnedPoints).toBe(1);
      expect(result.totalScore).toBe(2001);
    });
  });

  describe('collectItem - Error Handling', () => {
    it('should prevent duplicate chocolate collection', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'chocolate',
        itemIndex: 0,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Item already collected',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item already collected');
    });

    it('should enforce chocolate limit (30 per level)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'chocolate',
        itemIndex: 30,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Maximum 30 chocolates can be collected in this level',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.error).toContain('Maximum 30 chocolates');
    });

    it('should enforce egg limit (20 per level)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'egg',
        itemIndex: 20,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Maximum 20 eggs can be collected in this level',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.error).toContain('Maximum 20 eggs');
    });

    it('should enforce diamond limit (5 per level) (NEW)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'diamond',
        itemIndex: 5,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Maximum 5 diamonds can be collected in this level',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.error).toContain('Maximum 5 diamonds');
    });

    it('should enforce star limit (10 per level)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'star',
        itemIndex: 10,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Maximum 10 stars can be collected in this level',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.error).toContain('Maximum 10 stars');
    });

    it('should enforce coin limit (100 per level)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'coin',
        itemIndex: 100,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Maximum 100 coins can be collected in this level',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.error).toContain('Maximum 100 coins');
    });

    it('should handle negative item index', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'chocolate',
        itemIndex: -1,
      };

      mockGameService.validateItemCollection.mockResolvedValue({
        valid: false,
        error: 'Invalid item index',
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.valid).toBe(false);
    });
  });

  describe('collectItem - Offline Mode', () => {
    it('should accept offline collection with skipValidation flag (NEW)', async () => {
      const collectDto: CollectItemDto = {
        levelId: 1,
        itemType: 'diamond',
        itemIndex: 0,
        skipValidation: true,
      };

      mockGameService.validateItemCollection.mockResolvedValue({ valid: true });
      mockGameService.handleItemCollection.mockResolvedValue({
        valid: true,
        message: 'Item collected (offline mode)',
        earnedPoints: 100,
        totalScore: 1100,
        levelProgress: { diamondsTaken: [0] },
      });

      const result = await controller.collectItem(mockRequest, collectDto);

      expect(result.valid).toBe(true);
      expect(result.earnedPoints).toBe(100);
      // Offline mode should still validate but with skipValidation flag
      expect(mockGameService.validateItemCollection).toHaveBeenCalledWith(
        mockRequest.user.id,
        collectDto,
      );
    });
  });

  describe('collectItem - Score Tracking', () => {
    it('should accumulate points from multiple items', async () => {
      // Scenario: Collect chocolate (10) + egg (25) + diamond (100)
      const expectedPoints = 10 + 25 + 100;
      const expectedScore = 1000 + expectedPoints;

      // Chocolate
      mockGameService.handleItemCollection.mockResolvedValueOnce({
        earnedPoints: 10,
        totalScore: 1010,
      });
      let result = await controller.collectItem(mockRequest, {
        levelId: 1,
        itemType: 'chocolate',
        itemIndex: 0,
      });
      expect(result.totalScore).toBe(1010);

      // Egg
      mockGameService.handleItemCollection.mockResolvedValueOnce({
        earnedPoints: 25,
        totalScore: 1035,
      });
      result = await controller.collectItem(mockRequest, {
        levelId: 1,
        itemType: 'egg',
        itemIndex: 0,
      });
      expect(result.totalScore).toBe(1035);

      // Diamond
      mockGameService.handleItemCollection.mockResolvedValueOnce({
        earnedPoints: 100,
        totalScore: 1135,
      });
      result = await controller.collectItem(mockRequest, {
        levelId: 1,
        itemType: 'diamond',
        itemIndex: 0,
      });
      expect(result.totalScore).toBe(1135);

      // Verify final score
      expect(result.totalScore).toBe(1135);
    });
  });

  describe('completeLevelAsync - Level Completion', () => {
    it('should complete level with all items', async () => {
      const completeDto: CompleteLevelDto = {
        levelId: 1,
        score: 500,
        timeSpent: 120,
      };

      mockGameService.validateLevelComplete.mockResolvedValue({ valid: true });
      mockGameService.handleLevelComplete.mockResolvedValue({
        success: true,
        message: 'Level completed',
        totalScore: 1500,
        completedAt: new Date().toISOString(),
      });

      const result = await controller.completeLevelAsync(
        mockRequest,
        completeDto,
      );

      expect(result.success).toBe(true);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('getStats - Player Statistics', () => {
    it('should return all item type counts (NEW)', async () => {
      mockGameService.getPlayerStats.mockResolvedValue({
        levelId: 1,
        totalScore: 3500,
        totalChocolates: 30,
        totalEggs: 20,
        totalDiamonds: 5, // NEW
        totalStars: 8, // NEW
        totalCoins: 87, // NEW
        levelsCompleted: 3,
        totalPlayTime: 3600,
      });

      const result = await controller.getStats(mockRequest);

      expect(result.totalChocolates).toBe(30);
      expect(result.totalEggs).toBe(20);
      expect(result.totalDiamonds).toBe(5);
      expect(result.totalStars).toBe(8);
      expect(result.totalCoins).toBe(87);
    });
  });
});
