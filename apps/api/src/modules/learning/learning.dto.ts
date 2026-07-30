import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';

export class RecordLearningActivityDto {
  @ApiProperty({ example: 'student-uuid-200' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 'topic-ddd-intro' })
  @IsString()
  topicId!: string;

  @ApiProperty({ example: 0.88 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;
}

export class LearningRecordResponseDto {
  @ApiProperty({ example: 'record-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'student-uuid-200' })
  studentId!: string;

  @ApiProperty({ example: 'topic-ddd-intro' })
  topicId!: string;

  @ApiProperty({ example: 0.88 })
  masteryScore!: number;
}
