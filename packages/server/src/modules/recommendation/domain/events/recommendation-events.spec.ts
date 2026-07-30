import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { RecommendationId, RecommendationSetId } from '../identifiers/recommendation-ids.js';
import {
  RecommendationConsumed,
  RecommendationsExpired,
  RecommendationsGenerated,
  RecommendationSelected,
} from './recommendation-events.js';

const uuidService = new CryptoUuidService();

describe('recommendation domain events', () => {
  const setId = RecommendationSetId.create(uuidService.generate());
  const studentId = StudentId.create(uuidService.generate());
  const recId = RecommendationId.create(uuidService.generate());
  const occurredAt = new Date('2026-07-21T20:00:00.000Z');
  const envelope = {
    aggregateId: setId,
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt,
  } as const;

  it('creates RecommendationsGenerated event', () => {
    const expiresAt = new Date('2026-07-22T20:00:00.000Z');
    const event = new RecommendationsGenerated({
      ...envelope,
      count: 3,
      expiresAt,
      generationReason: 'PERIODIC',
      studentId,
    });

    expect(event.eventName).toBe('RecommendationsGenerated');
    expect(event.aggregateType).toBe('RecommendationSet');
    expect(event.payload).toEqual({
      count: 3,
      expiresAt: expiresAt.toISOString(),
      generationReason: 'PERIODIC',
      studentId: studentId.toString(),
    });
  });

  it('creates RecommendationSelected event', () => {
    const event = new RecommendationSelected({
      ...envelope,
      itemId: 'ex-1',
      itemType: 'exercise',
      recommendationId: recId,
      studentId,
    });

    expect(event.eventName).toBe('RecommendationSelected');
    expect(event.payload).toEqual({
      itemId: 'ex-1',
      itemType: 'exercise',
      recommendationId: recId.toString(),
      studentId: studentId.toString(),
    });
  });

  it('creates RecommendationConsumed event', () => {
    const consumedAt = new Date();
    const event = new RecommendationConsumed({
      ...envelope,
      consumedAt,
      itemId: 'ex-1',
      itemType: 'exercise',
      recommendationId: recId,
      studentId,
    });

    expect(event.eventName).toBe('RecommendationConsumed');
    expect(event.payload).toEqual({
      consumedAt: consumedAt.toISOString(),
      itemId: 'ex-1',
      itemType: 'exercise',
      recommendationId: recId.toString(),
      studentId: studentId.toString(),
    });
  });

  it('creates RecommendationsExpired event', () => {
    const event = new RecommendationsExpired({
      ...envelope,
      expiredCount: 5,
      studentId,
    });

    expect(event.eventName).toBe('RecommendationsExpired');
    expect(event.payload).toEqual({
      expiredCount: 5,
      studentId: studentId.toString(),
    });
  });
});
