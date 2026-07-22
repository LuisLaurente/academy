import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { LearningMetricsId, LearningRecordId, ReviewHistoryId, StudentId } from './learning-ids.js';

const uuidService = new CryptoUuidService();

describe('learning identifiers', () => {
  it('creates LearningRecordId and compares equality', () => {
    const rawUuid = uuidService.generate();
    const id1 = LearningRecordId.create(rawUuid);
    const id2 = LearningRecordId.create(rawUuid);
    const id3 = LearningRecordId.create(uuidService.generate());

    expect(id1.value).toBe(rawUuid);
    expect(id1.toString()).toBe(rawUuid);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates StudentId and compares equality', () => {
    const rawUuid = uuidService.generate();
    const id1 = StudentId.create(rawUuid);
    const id2 = StudentId.create(rawUuid);

    expect(id1.value).toBe(rawUuid);
    expect(id1.equals(id2)).toBe(true);
  });

  it('creates ReviewHistoryId and LearningMetricsId', () => {
    const rawUuid1 = uuidService.generate();
    const rawUuid2 = uuidService.generate();

    const reviewId = ReviewHistoryId.create(rawUuid1);
    const metricsId = LearningMetricsId.create(rawUuid2);

    expect(reviewId.value).toBe(rawUuid1);
    expect(metricsId.value).toBe(rawUuid2);
  });
});
