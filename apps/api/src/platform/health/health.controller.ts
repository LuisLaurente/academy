import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  @Get('live')
  getLiveness(): Readonly<{ status: 'ok' }> {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        await this.prisma.ping();
        return { postgres: { status: 'up' as const } };
      },
      async () => {
        const response = await this.redis.ping();

        if (response !== 'PONG') {
          throw new Error('Redis did not acknowledge the health probe.');
        }

        return { redis: { status: 'up' as const } };
      },
    ]);
  }
}
