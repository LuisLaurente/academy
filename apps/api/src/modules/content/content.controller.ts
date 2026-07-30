// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaContentRepository } from '@learning-os/server/infrastructure';
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
import { ContentBlockDto } from './content.dto';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly repository: PrismaContentRepository) {
    void this.repository;
  }

  @Get('blocks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a pedagogical content block by ID' })
  @ApiResponse({ status: 200, type: ContentBlockDto })
  async getBlockById(@Param('id') id: string): Promise<ContentBlockDto> {
    const block = await this.repository.findById(id);
    if (!block) {
      throw new NotFoundException('Content block not found.');
    }

    return {
      body: block.body,
      contentType: block.contentType,
      id: block.id,
      title: block.title,
      version: block.version,
    };
  }

  @Post('blocks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update a content block' })
  @ApiResponse({ status: 201, type: ContentBlockDto })
  async saveBlock(@Body() dto: ContentBlockDto): Promise<ContentBlockDto> {
    await this.repository.save({
      body: dto.body,
      contentType: dto.contentType,
      id: dto.id,
      title: dto.title,
      version: dto.version,
    });
    return dto;
  }
}
