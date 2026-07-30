import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { RecommendationSet } from '../../domain/aggregates/recommendation-set.js';
import { RecommendationReason } from '../../domain/entities/recommendation-reason.js';
import { Recommendation } from '../../domain/entities/recommendation.js';
import {
  RecommendationId,
  RecommendationReasonId,
  RecommendationSetId,
} from '../../domain/identifiers/recommendation-ids.js';
import { ExpirationTime } from '../../domain/value-objects/expiration-time.js';
import { RecommendationRank } from '../../domain/value-objects/recommendation-rank.js';
import { RecommendationWeight } from '../../domain/value-objects/recommendation-weight.js';
import {
  DefaultRecommendationRanker,
  DefaultRecommendationScorer,
  DefaultRecommendationStrategy,
} from '../../infrastructure/default-services.js';
import type { GenerateRecommendationsInput } from '../dtos/recommendation-inputs.js';
import type { RecommendationRanker } from '../ports/recommendation-ranker.js';
import type { RecommendationRepository } from '../ports/recommendation-repository.js';
import type { RecommendationScorer } from '../ports/recommendation-scorer.js';
import type { RecommendationStrategy } from '../ports/recommendation-strategy.js';

export class GenerateRecommendations {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly uuidService: UuidService,
    private readonly strategy: RecommendationStrategy = new DefaultRecommendationStrategy(),
    private readonly scorer: RecommendationScorer = new DefaultRecommendationScorer(),
    private readonly ranker: RecommendationRanker = new DefaultRecommendationRanker(),
  ) {}

  async execute(
    input: GenerateRecommendationsInput,
  ): Promise<ResultType<RecommendationSetId, DomainError>> {
    const studentId = StudentId.create(input.studentId as Uuid);
    const ttlHours = input.ttlHours ?? 24;

    const expiresTimeRes = ExpirationTime.fromHours(ttlHours);
    if (!expiresTimeRes.isSuccess) {
      return Result.failure(expiresTimeRes.error);
    }

    const candidates = await this.strategy.generateCandidates(studentId, {
      candidateLimit: input.candidateLimit ?? 5,
    });

    const recommendations: Recommendation[] = candidates.map((candidate, index) => {
      const score = this.scorer.scoreCandidate(candidate);
      const reasonWeightRes = RecommendationWeight.default();
      const reason = RecommendationReason.create({
        code: candidate.reasonCode,
        description: candidate.reasonDescription,
        id: RecommendationReasonId.create(this.uuidService.generate()),
        weight: reasonWeightRes,
      });

      const initialRankRes = RecommendationRank.create(index + 1);
      const rank = initialRankRes.isSuccess ? initialRankRes.value : RecommendationRank.top();

      return Recommendation.create({
        id: RecommendationId.create(this.uuidService.generate()),
        itemId: candidate.itemId,
        itemType: candidate.itemType,
        rank,
        reason,
        score,
      });
    });

    const ranked = this.ranker.rankRecommendations(recommendations);

    const setId = RecommendationSetId.create(
      input.setId ? (input.setId as Uuid) : this.uuidService.generate(),
    );

    const set = RecommendationSet.create({
      eventId: this.uuidService.generate(),
      expiresAt: expiresTimeRes.value,
      generationReason: input.reason ?? 'PERIODIC_RECOMMENDATION',
      id: setId,
      recommendations: ranked,
      studentId,
    });

    await this.recommendationRepository.save(set);

    return Result.success(setId);
  }
}
