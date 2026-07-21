import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CacheInfrastructureModule } from '../../infrastructure/cache/cache-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, DatabaseModule, CacheInfrastructureModule],
  controllers: [HealthController],
})
export class HealthModule {}
