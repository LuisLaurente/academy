import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { AIRequestId, GenerationJobId } from '../identifiers/ai-orchestration-ids.js';
import {
  GenerationCompleted,
  GenerationFailed,
  GenerationRequested,
  GenerationStarted,
} from './ai-orchestration-events.js';

const uuidService = new CryptoUuidService();

describe('AI Orchestration domain events', () => {
  const requestId = AIRequestId.create(uuidService.generate());
  const jobId = GenerationJobId.create(uuidService.generate());
  const occurredAt = new Date('2026-07-22T00:00:00.000Z');
  const envelope = {
    aggregateId: requestId,
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt,
  } as const;

  it('creates GenerationRequested event', () => {
    const event = new GenerationRequested({
      ...envelope,
      contentId: 'cont-1',
      curriculumItemId: 'curr-1',
      priority: 'high',
      requestType: 'exercise_generation',
    });

    expect(event.eventName).toBe('GenerationRequested');
    expect(event.aggregateType).toBe('GenerationRequest');
    expect(event.payload).toEqual({
      contentId: 'cont-1',
      curriculumItemId: 'curr-1',
      priority: 'high',
      requestType: 'exercise_generation',
    });
  });

  it('creates GenerationStarted event', () => {
    const event = new GenerationStarted({
      ...envelope,
      attemptNumber: 1,
      jobId,
      startedAt: occurredAt,
    });

    expect(event.eventName).toBe('GenerationStarted');
    expect(event.payload).toEqual({
      attemptNumber: 1,
      jobId: jobId.toString(),
      startedAt: occurredAt.toISOString(),
    });
  });

  it('creates GenerationCompleted event', () => {
    const finishedAt = new Date('2026-07-22T00:01:00.000Z');
    const event = new GenerationCompleted({
      ...envelope,
      artifactId: 'art-1',
      durationMs: 1200,
      finishedAt,
      tokensUsed: 300,
    });

    expect(event.eventName).toBe('GenerationCompleted');
    expect(event.payload).toEqual({
      artifactId: 'art-1',
      durationMs: 1200,
      finishedAt: finishedAt.toISOString(),
      tokensUsed: 300,
    });
  });

  it('creates GenerationFailed event', () => {
    const failedAt = new Date('2026-07-22T00:01:00.000Z');
    const event = new GenerationFailed({
      ...envelope,
      attemptNumber: 2,
      canRetry: true,
      failedAt,
      reason: 'Timeout',
    });

    expect(event.eventName).toBe('GenerationFailed');
    expect(event.payload).toEqual({
      attemptNumber: 2,
      canRetry: true,
      failedAt: failedAt.toISOString(),
      reason: 'Timeout',
    });
  });
});
