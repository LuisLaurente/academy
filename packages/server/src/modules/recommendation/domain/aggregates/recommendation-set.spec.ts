import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { RecommendationReason } from '../entities/recommendation-reason.js';
import { RecommendationScore } from '../entities/recommendation-score.js';
import { Recommendation } from '../entities/recommendation.js';
import {
  RecommendationId,
  RecommendationReasonId,
  RecommendationScoreId,
  RecommendationSetId,
} from '../identifiers/recommendation-ids.js';
import { ExpirationTime } from '../value-objects/expiration-time.js';
import { PriorityScore } from '../value-objects/priority-score.js';
import { RecommendationConfidence } from '../value-objects/recommendation-confidence.js';
import { RecommendationRank } from '../value-objects/recommendation-rank.js';
import { RecommendationWeight } from '../value-objects/recommendation-weight.js';
import { RecommendationSet } from './recommendation-set.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('RecommendationSet aggregate root', () => {
  const createTestSet = (ttlHours = 24) => {
    const setId = RecommendationSetId.create(uuidService.generate());
    const studentId = StudentId.create(uuidService.generate());
    const recId = RecommendationId.create(uuidService.generate());

    const rec = Recommendation.create({
      id: recId,
      itemId: 'ex-101',
      itemType: 'exercise',
      rank: RecommendationRank.top(),
      reason: RecommendationReason.create({
        code: 'LOW_MASTERY',
        description: 'Needs review',
        id: RecommendationReasonId.create(uuidService.generate()),
        weight: RecommendationWeight.default(),
      }),
      score: RecommendationScore.create({
        confidence: RecommendationConfidence.default(),
        id: RecommendationScoreId.create(uuidService.generate()),
        priority: unwrap(PriorityScore.create(0.9)),
        weight: RecommendationWeight.default(),
      }),
    });

    const set = RecommendationSet.create({
      eventId: uuidService.generate(),
      expiresAt: unwrap(ExpirationTime.fromHours(ttlHours)),
      generationReason: 'INITIAL',
      id: setId,
      recommendations: [rec],
      studentId,
    });

    return { rec, recId, set, setId, studentId };
  };

  it('creates recommendation set and records generation event', () => {
    const { recId, set, setId, studentId } = createTestSet();

    expect(set.id.equals(setId)).toBe(true);
    expect(set.studentId.equals(studentId)).toBe(true);
    expect(set.recommendations.length).toBe(1);
    expect(set.recommendations[0]?.id.equals(recId)).toBe(true);
    expect(set.generationReason).toBe('INITIAL');
    expect(set.pendingDomainEvents.length).toBe(1);
    expect(set.pendingDomainEvents[0]?.eventName).toBe('RecommendationsGenerated');
  });

  it('selects and consumes a recommendation successfully', () => {
    const { recId, set } = createTestSet();
    set.clearDomainEvents();

    const eventId1 = uuidService.generate();
    const selectRes = set.selectRecommendation(recId, eventId1);

    expect(selectRes.isSuccess).toBe(true);
    expect(set.recommendations[0]?.status).toBe('selected');
    expect(set.pendingDomainEvents.length).toBe(1);
    expect(set.pendingDomainEvents[0]?.eventName).toBe('RecommendationSelected');

    set.clearDomainEvents();
    const eventId2 = uuidService.generate();
    const consumeRes = set.consumeRecommendation(recId, eventId2);

    expect(consumeRes.isSuccess).toBe(true);
    expect(set.recommendations[0]?.status).toBe('consumed');
    expect(set.pendingDomainEvents.length).toBe(1);
    expect(set.pendingDomainEvents[0]?.eventName).toBe('RecommendationConsumed');
  });

  it('prevents selection/consumption when set is expired', () => {
    const { recId, set } = createTestSet(-1); // already expired
    const eventId = uuidService.generate();

    const selectRes = set.selectRecommendation(recId, eventId);
    expect(selectRes.isSuccess).toBe(false);
    if (!selectRes.isSuccess) {
      expect(selectRes.error.code).toBe('recommendation.expired');
    }

    const consumeRes = set.consumeRecommendation(recId, eventId);
    expect(consumeRes.isSuccess).toBe(false);
    if (!consumeRes.isSuccess) {
      expect(consumeRes.error.code).toBe('recommendation.expired');
    }
  });

  it('returns not found error when selecting non-existing recommendation', () => {
    const { set } = createTestSet();
    const fakeRecId = RecommendationId.create(uuidService.generate());

    const result = set.selectRecommendation(fakeRecId, uuidService.generate());
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('recommendation.not-found');
    }
  });

  it('expires all recommendations in the set', () => {
    const { set } = createTestSet();
    set.clearDomainEvents();

    const eventId = uuidService.generate();
    const result = set.expireAll(eventId);

    expect(result.isSuccess).toBe(true);
    expect(set.recommendations[0]?.status).toBe('expired');
    expect(set.pendingDomainEvents.length).toBe(1);
    expect(set.pendingDomainEvents[0]?.eventName).toBe('RecommendationsExpired');
  });
});
