import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import {
  RecommendationId,
  RecommendationReasonId,
  RecommendationScoreId,
  RecommendationSetId,
} from './recommendation-ids.js';

const uuidService = new CryptoUuidService();

describe('recommendation identifiers', () => {
  it('creates RecommendationSetId and tests equality', () => {
    const rawUuid = uuidService.generate();
    const id1 = RecommendationSetId.create(rawUuid);
    const id2 = RecommendationSetId.create(rawUuid);
    const id3 = RecommendationSetId.create(uuidService.generate());

    expect(id1.value).toBe(rawUuid);
    expect(id1.toString()).toBe(rawUuid);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates RecommendationId, RecommendationReasonId, RecommendationScoreId', () => {
    const rawUuid1 = uuidService.generate();
    const rawUuid2 = uuidService.generate();
    const rawUuid3 = uuidService.generate();

    const recId = RecommendationId.create(rawUuid1);
    const reasonId = RecommendationReasonId.create(rawUuid2);
    const scoreId = RecommendationScoreId.create(rawUuid3);

    expect(recId.value).toBe(rawUuid1);
    expect(reasonId.value).toBe(rawUuid2);
    expect(scoreId.value).toBe(rawUuid3);
  });
});
