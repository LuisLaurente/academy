import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Min, IsOptional, IsBoolean } from 'class-validator';

export class CurriculumItemDto {
  @ApiProperty({ example: 'curr-item-101' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Domain Driven Design' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Introduction to Bounded Contexts' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'intermediate' })
  @IsString()
  difficulty!: string;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(1)
  estimatedMins!: number;
}

export class GenerateSyllabusDto {
  @ApiProperty({ example: 'Python para ciencia de datos' })
  @IsString()
  topic!: string;

  @ApiPropertyOptional({ example: 'gemini' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  forceNew?: boolean;
}

export class GenerateSyllabusResponseDto {
  @ApiProperty({ example: 'duplicate_found' })
  @IsString()
  status!: 'duplicate_found' | 'success' | 'error';

  @ApiPropertyOptional({ type: [CurriculumItemDto] })
  @IsOptional()
  duplicates?: CurriculumItemDto[];

  @ApiPropertyOptional({ example: 'curr-generated-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'No API key configured for Gemini' })
  @IsOptional()
  @IsString()
  message?: string;
}
