import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { RecommendationNotFoundError } from '../../domain/errors/recommendation-errors.js';
import {
  RecommendationId,
  RecommendationSetId,
} from '../../domain/identifiers/recommendation-ids.js';
import type { ConsumeRecommendationInput } from '../dtos/recommendation-inputs.js';
import type { RecommendationRepository } from '../ports/recommendation-repository.js';

export class ConsumeRecommendation {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(input: ConsumeRecommendationInput): Promise<ResultType<void, DomainError>> {
    const setId = RecommendationSetId.create(input.setId as Uuid);
    const set = await this.recommendationRepository.findById(setId);

    if (!set) {
      return Result.failure(new RecommendationNotFoundError(input.setId));
    }

    const recId = RecommendationId.create(input.recommendationId as Uuid);
    const consumeRes = set.consumeRecommendation(
      recId,
      this.uuidService.generate(),
      input.consumedAt ?? new Date(),
    );

    if (!consumeRes.isSuccess) {
      return consumeRes;
    }

    await this.recommendationRepository.save(set);

    return Result.success(undefined);
  }
}
