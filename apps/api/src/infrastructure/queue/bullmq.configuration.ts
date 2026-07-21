import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BullMqConnectionConfiguration {
  readonly prefix: string;
  readonly url: string;
}

@Injectable()
export class BullMqConfiguration {
  readonly connection: BullMqConnectionConfiguration;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.connection = {
      prefix: config.getOrThrow<string>('BULLMQ_PREFIX'),
      url: config.getOrThrow<string>('REDIS_URL'),
    };
  }
}
