import { describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('exposes a dependency-free liveness response', () => {
    const controller = new HealthController(
      { check: vi.fn() } as never,
      { ping: vi.fn() } as never,
      { ping: vi.fn() } as never,
    );

    expect(controller.getLiveness()).toEqual({ status: 'ok' });
  });
});
