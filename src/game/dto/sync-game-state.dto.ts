import { IsOptional, IsObject, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SyncGameStateDto {
  @ApiProperty({
    description: 'Level progress data object (levelId -> progress map)',
    type: Object,
    example: {
      level_1: {
        chocolatesTaken: [0, 1, 2],
        eggsTaken: [0],
        completed: true,
      },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  levelsData?: Record<
    string,
    {
      chocolatesTaken: number[];
      eggsTaken: number[];
      completed: boolean;
    }
  >;

  @ApiProperty({
    description: 'Inventory data object',
    type: Object,
    example: {
      weapons: [],
      potions: [],
      collectibles: [],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  inventory?: Record<string, any>;

  @ApiProperty({
    description: 'Missions progress data',
    type: Object,
    example: {},
    required: false,
  })
  @IsOptional()
  @IsObject()
  missions?: Record<string, any>;

  @ApiProperty({
    description: 'Achievements unlocked',
    type: Object,
    example: {},
    required: false,
  })
  @IsOptional()
  @IsObject()
  achievements?: Record<string, any>;

  @ApiProperty({
    example: 15000,
    description: 'Total score accumulated',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @ApiProperty({
    example: 3600,
    description: 'Total play time in seconds',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  totalPlayTime?: number;
}
