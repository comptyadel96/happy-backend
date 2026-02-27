import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteLevelDto {
  @ApiProperty({
    example: 1,
    description: 'Level ID to mark as completed',
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'levelId must be a positive number' })
  levelId: number;

  @ApiProperty({
    example: 1500,
    description: 'Total score achieved in the level',
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'score must be >= 0' })
  score: number;

  @ApiProperty({
    example: 45,
    description: 'Time spent in the level (in seconds)',
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'timeSpent must be >= 0' })
  timeSpent: number;
}
