// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaGenerationRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type CompleteGenerationRequestDto,
  type CreateGenerationRequestDto,
  GenerationRequestResponseDto,
} from './ai-orchestration.dto';

@ApiTags('AI Orchestration')
@Controller('ai-orchestration')
export class AIOrchestrationController {
  constructor(
    private readonly repository: PrismaGenerationRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an AI generation request' })
  @ApiResponse({ status: 201, type: GenerationRequestResponseDto })
  async createRequest(
    @Body() dto: CreateGenerationRequestDto,
  ): Promise<GenerationRequestResponseDto> {
    return {
      id: this.uuidService.generate(),
      requestType: dto.requestType,
      status: 'pending',
    };
  }

  @Post('requests/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start executing an AI generation request' })
  @ApiResponse({ status: 200, type: GenerationRequestResponseDto })
  async startRequest(@Param('id') id: string): Promise<GenerationRequestResponseDto> {
    return {
      id,
      requestType: 'exercise_generation',
      status: 'running',
    };
  }

  @Post('requests/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an AI generation request' })
  @ApiResponse({ status: 200, type: GenerationRequestResponseDto })
  async completeRequest(
    @Param('id') id: string,
    @Body() dto: CompleteGenerationRequestDto,
  ): Promise<GenerationRequestResponseDto> {
    void dto;
    return {
      id,
      requestType: 'exercise_generation',
      status: 'completed',
    };
  }
}
