import { describe, expect, it } from 'vitest';

import { SystemClock, type Clock } from './clock.js';

class FixedClock implements Clock {
  constructor(private readonly fixedInstant: Date) {}

  now(): Date {
    return new Date(this.fixedInstant);
  }
}

function readTime(clock: Clock): Date {
  return clock.now();
}

describe('Clock', () => {
  it('reads the current time through the system adapter', () => {
    const beforeReading = Date.now();
    const currentTime = readTime(new SystemClock());
    const afterReading = Date.now();

    expect(currentTime.getTime()).toBeGreaterThanOrEqual(beforeReading);
    expect(currentTime.getTime()).toBeLessThanOrEqual(afterReading);
  });

  it('can be replaced by a deterministic implementation', () => {
    const expectedTime = new Date('2026-01-15T10:30:00.000Z');
    const clock: Clock = new FixedClock(expectedTime);

    expect(readTime(clock)).toEqual(expectedTime);
    expect(readTime(clock)).not.toBe(expectedTime);
  });
});
