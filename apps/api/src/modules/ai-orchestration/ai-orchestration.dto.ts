import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGenerationRequestDto {
  @ApiProperty({ example: 'exercise_generation' })
  @IsString()
  requestType!: string;

  @ApiPropertyOptional({ example: 'high' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'curr-101' })
  @IsOptional()
  @IsString()
  curriculumItemId?: string;

  @ApiPropertyOptional({ example: 'cont-202' })
  @IsOptional()
  @IsString()
  contentId?: string;
}

export class CompleteGenerationRequestDto {
  @ApiProperty({ example: 'exercise_payload' })
  @IsString()
  artifactType!: string;

  @ApiProperty({ example: '{"question": "What is DDD?"}' })
  @IsString()
  contentPayload!: string;

  @ApiPropertyOptional({ example: 'claude-3-5-sonnet' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  tokensUsed?: number;

  @ApiPropertyOptional({ example: 0.002 })
  @IsOptional()
  @IsNumber()
  estimatedCostUSD?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  durationMs?: number;
}

export class GenerationRequestResponseDto {
  @ApiProperty({ example: 'ai-req-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'exercise_generation' })
  requestType!: string;

  @ApiProperty({ example: 'pending' })
  status!: string;
}
