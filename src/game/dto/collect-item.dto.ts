import { IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CollectItemDto {
  @ApiProperty({
    example: 1,
    description: 'Level ID where the item is located',
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'levelId must be a positive number' })
  levelId: number;

  @ApiProperty({
    example: 'chocolate',
    description: 'Type of item to collect',
    enum: ['chocolate', 'egg'],
  })
  @IsEnum(['chocolate', 'egg'], {
    message: 'itemType must be either "chocolate" or "egg"',
  })
  itemType: 'chocolate' | 'egg';

  @ApiProperty({
    example: 0,
    description: 'Index of the item in the level (0-based)',
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'itemIndex must be >= 0' })
  itemIndex: number;
}
