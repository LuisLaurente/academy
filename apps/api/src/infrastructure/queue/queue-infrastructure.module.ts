import { Module } from '@nestjs/common';

import { BullMqConfiguration } from './bullmq.configuration';

@Module({
  providers: [BullMqConfiguration],
  exports: [BullMqConfiguration],
})
export class QueueInfrastructureModule {}
