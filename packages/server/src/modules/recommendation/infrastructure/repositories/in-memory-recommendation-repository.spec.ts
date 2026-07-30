import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { RecommendationSet } from '../../domain/aggregates/recommendation-set.js';
import { RecommendationSetId } from '../../domain/identifiers/recommendation-ids.js';
import { ExpirationTime } from '../../domain/value-objects/expiration-time.js';
import { InMemoryRecommendationRepository } from './in-memory-recommendation-repository.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('InMemoryRecommendationRepository', () => {
  it('saves, retrieves, finds active sets, and deletes', async () => {
    const repo = new InMemoryRecommendationRepository();
    const student1 = StudentId.create(uuidService.generate());
    const student2 = StudentId.create(uuidService.generate());

    const activeSet = RecommendationSet.create({
      expiresAt: unwrap(ExpirationTime.fromHours(24)),
      generationReason: 'ACTIVE',
      id: RecommendationSetId.create(uuidService.generate()),
      recommendations: [],
      studentId: student1,
    });

    const expiredSet = RecommendationSet.create({
      expiresAt: unwrap(ExpirationTime.fromHours(-1)),
      generationReason: 'EXPIRED',
      id: RecommendationSetId.create(uuidService.generate()),
      recommendations: [],
      studentId: student1,
    });

    const student2Set = RecommendationSet.create({
      expiresAt: unwrap(ExpirationTime.fromHours(10)),
      generationReason: 'OTHER',
      id: RecommendationSetId.create(uuidService.generate()),
      recommendations: [],
      studentId: student2,
    });

    await repo.save(activeSet);
    await repo.save(expiredSet);
    await repo.save(student2Set);

    expect(repo.count).toBe(3);

    const foundActive = await repo.findActiveByStudentId(student1);
    expect(foundActive).not.toBeNull();
    expect(foundActive?.id.equals(activeSet.id)).toBe(true);

    const allStudent1 = await repo.findByStudentId(student1);
    expect(allStudent1.length).toBe(2);

    await repo.delete(activeSet.id);
    expect(repo.count).toBe(2);

    repo.clear();
    expect(repo.count).toBe(0);
  });
});
