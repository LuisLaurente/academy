// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaCurriculumRepository } from '@learning-os/server/infrastructure';
import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurriculumItemDto } from './curriculum.dto';

@ApiTags('Curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly repository: PrismaCurriculumRepository) {
    void this.repository;
  }

  @Get('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all available curriculum items' })
  @ApiResponse({ status: 200, type: [CurriculumItemDto] })
  async getItems(): Promise<readonly CurriculumItemDto[]> {
    return [
      {
        description: 'Fundamentals of Domain-Driven Design',
        difficulty: 'intermediate',
        estimatedMins: 45,
        id: 'curr-ddd-core',
        title: 'DDD Core Concepts',
      },
    ];
  }

  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a specific curriculum item' })
  @ApiResponse({ status: 200, type: CurriculumItemDto })
  async getItemById(@Param('id') id: string): Promise<CurriculumItemDto> {
    if (!id) {
      throw new NotFoundException('Curriculum item not found.');
    }
    return {
      description: 'Fundamentals of Domain-Driven Design',
      difficulty: 'intermediate',
      estimatedMins: 45,
      id,
      title: 'DDD Core Concepts',
    };
  }
}
