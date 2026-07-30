import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class RecommendationError<
  TCode extends string = string,
> extends DomainError<TCode> {}

export class InvalidRecommendationScoreError extends RecommendationError<'recommendation.invalid-score'> {
  constructor(field: string, providedValue: number) {
    super({
      category: 'validation',
      code: 'recommendation.invalid-score',
      context: { field, providedValue },
      message: `The supplied ${field} score (${providedValue}) is invalid.`,
    });
  }
}

export class RecommendationExpiredError extends RecommendationError<'recommendation.expired'> {
  constructor(setId: string, expiresAt: Date) {
    super({
      category: 'domain-conflict',
      code: 'recommendation.expired',
      context: { expiresAt: expiresAt.toISOString(), setId },
      message: `The recommendation set '${setId}' expired at ${expiresAt.toISOString()}.`,
    });
  }
}

export class RecommendationAlreadyConsumedError extends RecommendationError<'recommendation.already-consumed'> {
  constructor(recommendationId: string) {
    super({
      category: 'domain-conflict',
      code: 'recommendation.already-consumed',
      context: { recommendationId },
      message: `The recommendation '${recommendationId}' has already been consumed.`,
    });
  }
}

export class RecommendationGenerationError extends RecommendationError<'recommendation.generation-failed'> {
  constructor(reason: string) {
    super({
      category: 'domain-conflict',
      code: 'recommendation.generation-failed',
      context: { reason },
      message: `Failed to generate recommendations: ${reason}`,
    });
  }
}

export class RecommendationNotFoundError extends RecommendationError<'recommendation.not-found'> {
  constructor(id: string) {
    super({
      category: 'not-found',
      code: 'recommendation.not-found',
      context: { id },
      message: `The recommendation or set '${id}' was not found.`,
    });
  }
}

export class InvalidRecommendationStateError extends RecommendationError<'recommendation.invalid-state'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'recommendation.invalid-state',
      context: { reason },
      message: `Invalid recommendation state: ${reason}`,
    });
  }
}
