import {
  IsInt,
  IsArray,
  IsBoolean,
  IsString,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class HappyLettersDto {
  @ApiProperty({ example: false })
  H: boolean;

  @ApiProperty({ example: false })
  A: boolean;

  @ApiProperty({ example: false })
  P: boolean;

  @ApiProperty({ example: false })
  P2: boolean;

  @ApiProperty({ example: false })
  Y: boolean;
}

export class LevelDataDto {
  @ApiProperty({ example: 1, description: 'Level ID (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  levelId: number;

  @ApiProperty({ example: 15, description: 'Number of chocolates collected' })
  @IsInt()
  @Min(0)
  chokolata_collected: number;

  @ApiProperty({ example: 2, description: 'Number of eggs collected' })
  @IsInt()
  @Min(0)
  eggs_collected: number;

  @ApiProperty({ example: 1, description: 'Number of diamonds collected' })
  @IsInt()
  @Min(0)
  diamond_collected: number;

  @ApiProperty({ example: 120, description: 'Time spent in level (seconds)' })
  @IsInt()
  @Min(0)
  time: number;

  @ApiProperty({ example: 8500, description: 'Score for level' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({
    example: [true, true, false, false, true],
    description: 'Array indicating which chocolates were collected',
  })
  @IsArray()
  chokolate_taked: boolean[];

  @ApiProperty({
    example: [true, false],
    description: 'Array indicating which eggs were collected',
  })
  @IsArray()
  eggs_taked: boolean[];

  @ApiProperty({
    example: [true],
    description: 'Array indicating which diamonds were collected',
  })
  @IsArray()
  diamonds_taked: boolean[];

  @ApiProperty({ example: true, description: 'If level was completed' })
  @IsBoolean()
  level_won: boolean;

  @ApiProperty({ example: true, description: 'If level unlocked' })
  @IsBoolean()
  level_unlocked: boolean;

  @ApiProperty({
    example: '',
    description: 'Player checkpoint position name (empty string by default)',
  })
  @IsString()
  player_position_name: string;

  @ApiProperty({ description: 'Happy letters collected' })
  @IsObject()
  @ValidateNested()
  @Type(() => HappyLettersDto)
  happy_letters: HappyLettersDto;
}

export class SubmitLevelDataDto {
  @ApiProperty({ description: 'Level data submitted from game' })
  levelData: LevelDataDto;
}
