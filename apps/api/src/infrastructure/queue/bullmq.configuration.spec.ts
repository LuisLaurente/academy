import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { BullMqConfiguration } from './bullmq.configuration';

describe('BullMqConfiguration', () => {
  it('exposes validated connection metadata without creating a worker', () => {
    const config = new ConfigService({
      BULLMQ_PREFIX: 'learning-os-test',
      REDIS_URL: 'redis://localhost:6379/1',
    });

    const configuration = new BullMqConfiguration(config);

    expect(configuration.connection).toEqual({
      prefix: 'learning-os-test',
      url: 'redis://localhost:6379/1',
    });
  });
});
