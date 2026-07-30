import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

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
