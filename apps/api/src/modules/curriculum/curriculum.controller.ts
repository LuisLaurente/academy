// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaCurriculumRepository } from '@learning-os/server/infrastructure';
import { CurriculumItemId } from '@learning-os/server/curriculum';
import { type Uuid } from '@learning-os/server/core';
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
    const items = await this.repository.findAll();
    return items.map((item) => ({
      description: item.description,
      difficulty: item.difficulty,
      estimatedMins: item.estimatedMins,
      id: item.id,
      title: item.title,
    }));
  }

  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a specific curriculum item' })
  @ApiResponse({ status: 200, type: CurriculumItemDto })
  async getItemById(@Param('id') id: string): Promise<CurriculumItemDto> {
    const item = await this.repository.findById(CurriculumItemId.create(id as Uuid));
    if (!item) {
      throw new NotFoundException('Curriculum item not found.');
    }
    return {
      description: item.description,
      difficulty: item.difficulty,
      estimatedMins: item.estimatedMins,
      id: item.id,
      title: item.title,
    };
  }
}
