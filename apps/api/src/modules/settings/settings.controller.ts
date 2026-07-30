import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SettingResponseDto } from './settings.dto';
import type { UpdateSettingDto } from './settings.dto';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(AdminGuard)
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all system settings and API keys' })
  @ApiResponse({ status: 200, type: [SettingResponseDto] })
  async getSettings(): Promise<SettingResponseDto[]> {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => {
      let val = s.value;
      if (s.key.includes('key') && val.length > 8) {
        val = `${val.substring(0, 6)}...${val.substring(val.length - 4)}`;
      }
      return {
        key: s.key,
        value: val,
      };
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a system setting' })
  @ApiResponse({ status: 200, type: SettingResponseDto })
  async updateSetting(@Body() dto: UpdateSettingDto): Promise<SettingResponseDto> {
    const setting = await this.prisma.systemSetting.upsert({
      create: {
        key: dto.key,
        value: dto.value,
      },
      update: {
        value: dto.value,
      },
      where: { key: dto.key },
    });

    let val = setting.value;
    if (setting.key.includes('key') && val.length > 8) {
      val = `${val.substring(0, 6)}...${val.substring(val.length - 4)}`;
    }

    return {
      key: setting.key,
      value: val,
    };
  }
}
