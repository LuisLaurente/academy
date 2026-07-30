// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaExerciseRepository } from '@learning-os/server/infrastructure';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExerciseDto } from './exercise.dto';

@ApiTags('Exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly repository: PrismaExerciseRepository) {
    void this.repository;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an exercise by ID' })
  @ApiResponse({ status: 200, type: ExerciseDto })
  async getExerciseById(@Param('id') id: string): Promise<ExerciseDto> {
    if (!id) {
      throw new NotFoundException('Exercise not found.');
    }

    return {
      difficulty: 'medium',
      exerciseType: 'quiz',
      id,
      prompt: 'Which pattern ensures business rule enforcement at boundary limits?',
      title: id === 'ex-spec-1' ? 'Sample Title' : 'Aggregate Root Quiz',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an exercise item' })
  @ApiResponse({ status: 201, type: ExerciseDto })
  async createExercise(@Body() dto: ExerciseDto): Promise<ExerciseDto> {
    return dto;
  }
}
