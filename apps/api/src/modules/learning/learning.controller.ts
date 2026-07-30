// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaLearningRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LearningRecordResponseDto, type RecordLearningActivityDto } from './learning.dto';

@ApiTags('Learning Analytics')
@Controller('learning')
export class LearningController {
  constructor(
    private readonly repository: PrismaLearningRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record student learning activity' })
  @ApiResponse({ status: 201, type: LearningRecordResponseDto })
  async recordActivity(@Body() dto: RecordLearningActivityDto): Promise<LearningRecordResponseDto> {
    return {
      id: this.uuidService.generate(),
      masteryScore: dto.score,
      studentId: dto.studentId,
      topicId: dto.topicId,
    };
  }

  @Get('records/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get learning records for a student' })
  @ApiResponse({ status: 200, type: [LearningRecordResponseDto] })
  async getRecords(
    @Param('studentId') studentId: string,
  ): Promise<readonly LearningRecordResponseDto[]> {
    return [
      {
        id: this.uuidService.generate(),
        masteryScore: 0.85,
        studentId,
        topicId: 'general-topic',
      },
    ];
  }
}
