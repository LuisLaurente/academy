// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto, type LoginUserDto, type RegisterUserDto } from './auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly uuidService: CryptoUuidService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterUserDto): Promise<AuthResponseDto> {
    if (!dto.email.includes('@')) {
      throw new BadRequestException('Invalid email address format.');
    }

    const userId = this.uuidService.generate();
    return {
      accessToken: `bearer-token-${userId}`,
      email: dto.email,
      userId,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginUserDto): Promise<AuthResponseDto> {
    if (!dto.email.includes('@')) {
      throw new BadRequestException('Invalid email address format.');
    }

    const userId = this.uuidService.generate();
    return {
      accessToken: `bearer-token-${userId}`,
      email: dto.email,
      userId,
    };
  }
}
