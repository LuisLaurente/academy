import { beforeEach, describe, expect, it } from 'vitest';
import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { StudentId } from '../learning/domain/identifiers/learning-ids.js';
import { ConsumeRecommendation } from './application/use-cases/consume-recommendation.js';
import { GenerateRecommendations } from './application/use-cases/generate-recommendations.js';
import { RankRecommendations } from './application/use-cases/rank-recommendations.js';
import { SelectRecommendation } from './application/use-cases/select-recommendation.js';
import { InMemoryRecommendationRepository } from './infrastructure/repositories/in-memory-recommendation-repository.js';

const uuidService = new CryptoUuidService();

describe('Recommendation use cases', () => {
  let repository: InMemoryRecommendationRepository;
  let generateUseCase: GenerateRecommendations;
  let rankUseCase: RankRecommendations;
  let selectUseCase: SelectRecommendation;
  let consumeUseCase: ConsumeRecommendation;

  beforeEach(() => {
    repository = new InMemoryRecommendationRepository();
    generateUseCase = new GenerateRecommendations(repository, uuidService);
    rankUseCase = new RankRecommendations(repository);
    selectUseCase = new SelectRecommendation(repository, uuidService);
    consumeUseCase = new ConsumeRecommendation(repository, uuidService);
  });

  describe('GenerateRecommendations', () => {
    it('generates a set of recommendations and saves it', async () => {
      const studentId = uuidService.generate();
      const result = await generateUseCase.execute({
        candidateLimit: 3,
        reason: 'NEW_SESSION',
        studentId,
        ttlHours: 12,
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const set = await repository.findById(result.value);
        expect(set).not.toBeNull();
        expect(set?.studentId.equals(StudentId.create(studentId as Uuid))).toBe(true);
        expect(set?.recommendations.length).toBe(3);
        expect(set?.generationReason).toBe('NEW_SESSION');
      }
    });
  });

  describe('RankRecommendations', () => {
    it('re-ranks recommendations in an existing set', async () => {
      const studentId = uuidService.generate();
      const genRes = await generateUseCase.execute({ studentId });
      expect(genRes.isSuccess).toBe(true);
      if (!genRes.isSuccess) return;

      const setId = genRes.value.toString();
      const rankRes = await rankUseCase.execute({ setId });

      expect(rankRes.isSuccess).toBe(true);
      if (rankRes.isSuccess) {
        expect(rankRes.value.length).toBeGreaterThan(0);
        expect(rankRes.value[0]?.rank.value).toBe(1);
      }
    });

    it('returns not found error if set does not exist', async () => {
      const result = await rankUseCase.execute({ setId: uuidService.generate() });
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('recommendation.not-found');
      }
    });
  });

  describe('SelectRecommendation', () => {
    it('selects a recommendation from a set', async () => {
      const studentId = uuidService.generate();
      const genRes = await generateUseCase.execute({ studentId });
      expect(genRes.isSuccess).toBe(true);
      if (!genRes.isSuccess) return;

      const set = await repository.findById(genRes.value);
      const firstRecId = set?.recommendations[0]?.id.toString();
      expect(firstRecId).toBeDefined();
      if (!firstRecId) return;

      const selectRes = await selectUseCase.execute({
        recommendationId: firstRecId,
        setId: genRes.value.toString(),
      });

      expect(selectRes.isSuccess).toBe(true);

      const updatedSet = await repository.findById(genRes.value);
      expect(updatedSet?.recommendations[0]?.status).toBe('selected');
    });
  });

  describe('ConsumeRecommendation', () => {
    it('consumes a recommendation from a set', async () => {
      const studentId = uuidService.generate();
      const genRes = await generateUseCase.execute({ studentId });
      expect(genRes.isSuccess).toBe(true);
      if (!genRes.isSuccess) return;

      const set = await repository.findById(genRes.value);
      const firstRecId = set?.recommendations[0]?.id.toString();
      expect(firstRecId).toBeDefined();
      if (!firstRecId) return;

      const consumeRes = await consumeUseCase.execute({
        recommendationId: firstRecId,
        setId: genRes.value.toString(),
      });

      expect(consumeRes.isSuccess).toBe(true);

      const updatedSet = await repository.findById(genRes.value);
      expect(updatedSet?.recommendations[0]?.status).toBe('consumed');
    });
  });
});
