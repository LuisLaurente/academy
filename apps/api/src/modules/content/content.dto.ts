import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ContentBlockDto {
  @ApiProperty({ example: 'cont-block-1' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Clean Architecture Principles' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'text' })
  @IsString()
  contentType!: string;

  @ApiProperty({ example: 'Content body explaining layers...' })
  @IsString()
  body!: string;

  @ApiProperty({ example: 'v1.0.0' })
  @IsString()
  version!: string;
}
