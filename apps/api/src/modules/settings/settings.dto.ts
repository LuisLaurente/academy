import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'gemini_api_key' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'AIzaSy...' })
  @IsString()
  value!: string;
}

export class SettingResponseDto {
  @ApiProperty({ example: 'gemini_api_key' })
  key!: string;

  @ApiProperty({ example: 'AIzaSy...****' })
  value!: string;
}
