// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaSessionRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type CompleteSessionItemDto,
  SessionResponseDto,
  type StartSessionDto,
} from './session.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly repository: PrismaSessionRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new learning session' })
  @ApiResponse({ status: 201, type: SessionResponseDto })
  async startSession(@Body() dto: StartSessionDto): Promise<SessionResponseDto> {
    return {
      completedCount: 0,
      id: this.uuidService.generate(),
      status: 'active',
      studentId: dto.studentId,
    };
  }

  @Post(':id/complete-item')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an item as completed in active session' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  async completeItem(
    @Param('id') id: string,
    @Body() dto: CompleteSessionItemDto,
  ): Promise<SessionResponseDto> {
    void dto;
    return {
      completedCount: 1,
      id,
      status: 'active',
      studentId: 'student-1',
    };
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finish an active learning session' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  async finishSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return {
      completedCount: 1,
      id,
      status: 'finished',
      studentId: 'student-1',
    };
  }
}
