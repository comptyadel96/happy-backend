import {
  IsObject,
  IsInt,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  [key: string]: {
    have: Record<string, boolean>;
    taked: Record<string, boolean>;
  };
}

export class LevelStateDto {
  [levelId: number]: {
    [stateName: string]: boolean;
  };
}

export class GameOptionsDto {
  @ApiProperty({ example: true })
  first_time_play: boolean;

  @ApiProperty({ example: 1 })
  happy_map_position: number;

  @ApiProperty({ example: 'ar' })
  language: string;
}

export class GameDataDto {
  @ApiProperty({ example: true })
  movment_hint_show: boolean;

  @ApiProperty({ example: true })
  ledder_hint_show: boolean;

  @ApiProperty({ example: true })
  use_hint_show: boolean;

  @ApiProperty({ example: true })
  hang_hint_show: boolean;

  @ApiProperty({ example: false })
  attack_skill: boolean;

  @ApiProperty({ example: false })
  climb_skill: boolean;
}

export class SyncGameStateDto {
  @ApiPropertyOptional({ description: 'Levels inventory data' })
  @IsObject()
  levelsInventory?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Levels states' })
  @IsObject()
  levelsStates?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Levels missions' })
  @IsObject()
  levelsMissions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Game options' })
  @ValidateNested()
  @Type(() => GameOptionsDto)
  gameOptions?: GameOptionsDto;

  @ApiPropertyOptional({ description: 'Game data' })
  @ValidateNested()
  @Type(() => GameDataDto)
  gameData?: GameDataDto;
}
