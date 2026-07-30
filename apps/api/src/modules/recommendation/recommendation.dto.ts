import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenerateRecommendationsDto {
  @ApiProperty({ example: 'student-uuid-300' })
  @IsString()
  studentId!: string;
}

export class RecommendationSetResponseDto {
  @ApiProperty({ example: 'rec-set-123' })
  id!: string;

  @ApiProperty({ example: 'student-uuid-300' })
  studentId!: string;

  @ApiProperty({ example: ['rec-item-1', 'rec-item-2'] })
  recommendedItems!: readonly string[];
}
