import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartWorkflowDto {
  @ApiProperty({ example: 'student-uuid-500' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 'curr-item-101' })
  @IsString()
  curriculumItemId!: string;
}

export class ExecuteStepDto {
  @ApiPropertyOptional({ example: 'ex-101' })
  @IsOptional()
  @IsString()
  exerciseId?: string;

  @ApiPropertyOptional({ example: '{"answer": "solution"}' })
  @IsOptional()
  @IsString()
  responsePayload?: string;
}

export class CompleteWorkflowDto {
  @ApiPropertyOptional({ example: 'Learning unit completed' })
  @IsOptional()
  @IsString()
  summary?: string;
}

export class WorkflowResponseDto {
  @ApiProperty({ example: 'flow-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'student-uuid-500' })
  studentId!: string;

  @ApiProperty({ example: 'running' })
  status!: string;

  @ApiProperty({ example: 'curriculum_selection' })
  currentStep!: string;
}
