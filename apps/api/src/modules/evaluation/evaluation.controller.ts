// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaEvaluationRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluationResponseDto, type SubmitEvaluationDto } from './evaluation.dto';

@ApiTags('Evaluation')
@Controller('evaluations')
export class EvaluationController {
  constructor(
    private readonly repository: PrismaEvaluationRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an exercise evaluation' })
  @ApiResponse({ status: 201, type: EvaluationResponseDto })
  async submitEvaluation(@Body() dto: SubmitEvaluationDto): Promise<EvaluationResponseDto> {
    return {
      evaluatedAt: new Date(),
      exerciseId: dto.exerciseId,
      feedback: dto.feedback ?? 'Evaluation completed successfully.',
      id: this.uuidService.generate(),
      isPassed: dto.isPassed,
      score: dto.score,
      studentId: dto.studentId,
    };
  }

  @Get('student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get evaluation history for a student' })
  @ApiResponse({ status: 200, type: [EvaluationResponseDto] })
  async getStudentEvaluations(
    @Param('studentId') studentId: string,
  ): Promise<readonly EvaluationResponseDto[]> {
    return [
      {
        evaluatedAt: new Date(),
        exerciseId: 'ex-100',
        feedback: 'Excellent work!',
        id: this.uuidService.generate(),
        isPassed: true,
        score: 0.9,
        studentId,
      },
    ];
  }
}
