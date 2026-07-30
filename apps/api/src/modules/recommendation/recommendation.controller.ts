// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaRecommendationRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type GenerateRecommendationsDto,
  RecommendationSetResponseDto,
} from './recommendation.dto';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly repository: PrismaRecommendationRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new recommendation set for a student' })
  @ApiResponse({ status: 201, type: RecommendationSetResponseDto })
  async generate(@Body() dto: GenerateRecommendationsDto): Promise<RecommendationSetResponseDto> {
    return {
      id: this.uuidService.generate(),
      recommendedItems: ['curr-ddd-core'],
      studentId: dto.studentId,
    };
  }

  @Get('active/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active recommendation set for a student' })
  @ApiResponse({ status: 200, type: RecommendationSetResponseDto })
  async getActive(@Param('studentId') studentId: string): Promise<RecommendationSetResponseDto> {
    return {
      id: this.uuidService.generate(),
      recommendedItems: ['curr-clean-arch'],
      studentId,
    };
  }
}
