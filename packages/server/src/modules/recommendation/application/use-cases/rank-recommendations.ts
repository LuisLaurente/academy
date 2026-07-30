import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Recommendation } from '../../domain/entities/recommendation.js';
import { RecommendationNotFoundError } from '../../domain/errors/recommendation-errors.js';
import { RecommendationSetId } from '../../domain/identifiers/recommendation-ids.js';
import { DefaultRecommendationRanker } from '../../infrastructure/default-services.js';
import type { RankRecommendationsInput } from '../dtos/recommendation-inputs.js';
import type { RecommendationRanker } from '../ports/recommendation-ranker.js';
import type { RecommendationRepository } from '../ports/recommendation-repository.js';

export class RankRecommendations {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly ranker: RecommendationRanker = new DefaultRecommendationRanker(),
  ) {}

  async execute(
    input: RankRecommendationsInput,
  ): Promise<ResultType<readonly Recommendation[], DomainError>> {
    const setId = RecommendationSetId.create(input.setId as Uuid);
    const set = await this.recommendationRepository.findById(setId);

    if (!set) {
      return Result.failure(new RecommendationNotFoundError(input.setId));
    }

    const reRanked = this.ranker.rankRecommendations(set.recommendations);
    set.reRank(reRanked);

    await this.recommendationRepository.save(set);

    return Result.success(set.recommendations);
  }
}
