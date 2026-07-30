import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitEvaluationDto {
  @ApiProperty({ example: 'student-uuid-100' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 'ex-101' })
  @IsString()
  exerciseId!: string;

  @ApiProperty({ example: 0.95 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isPassed!: boolean;

  @ApiPropertyOptional({ example: 'Great solution!' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class EvaluationResponseDto {
  @ApiProperty({ example: 'eval-uuid-101' })
  id!: string;

  @ApiProperty({ example: 'student-uuid-100' })
  studentId!: string;

  @ApiProperty({ example: 'ex-101' })
  exerciseId!: string;

  @ApiProperty({ example: 0.95 })
  score!: number;

  @ApiProperty({ example: true })
  isPassed!: boolean;

  @ApiPropertyOptional({ example: 'Great solution!' })
  feedback?: string;

  @ApiProperty()
  evaluatedAt!: Date;
}
