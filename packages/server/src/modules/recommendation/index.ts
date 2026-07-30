// Application DTOs
export type {
  ConsumeRecommendationInput,
  GenerateRecommendationsInput,
  RankRecommendationsInput,
  SelectRecommendationInput,
} from './application/dtos/recommendation-inputs.js';

// Application Ports
export type { RecommendationPolicy } from './application/ports/recommendation-policy.js';
export type { RecommendationRanker } from './application/ports/recommendation-ranker.js';
export type { RecommendationRepository } from './application/ports/recommendation-repository.js';
export type { RecommendationScorer } from './application/ports/recommendation-scorer.js';
export type {
  RecommendationCandidate,
  RecommendationStrategy,
} from './application/ports/recommendation-strategy.js';

// Use Cases
export { ConsumeRecommendation } from './application/use-cases/consume-recommendation.js';
export { GenerateRecommendations } from './application/use-cases/generate-recommendations.js';
export { RankRecommendations } from './application/use-cases/rank-recommendations.js';
export { SelectRecommendation } from './application/use-cases/select-recommendation.js';

// Aggregate
export {
  RecommendationSet,
  type CreateRecommendationSetProps,
  type RecommendationSetTimestamps,
} from './domain/aggregates/recommendation-set.js';

// Entities
export {
  RecommendationReason,
  type CreateRecommendationReasonProps,
} from './domain/entities/recommendation-reason.js';
export {
  RecommendationScore,
  type CreateRecommendationScoreProps,
} from './domain/entities/recommendation-score.js';
export {
  Recommendation,
  type CreateRecommendationProps,
  type RecommendationItemType,
  type RecommendationStatus,
} from './domain/entities/recommendation.js';

// Errors
export {
  InvalidRecommendationScoreError,
  InvalidRecommendationStateError,
  RecommendationAlreadyConsumedError,
  RecommendationError,
  RecommendationExpiredError,
  RecommendationGenerationError,
  RecommendationNotFoundError,
} from './domain/errors/recommendation-errors.js';

// Events
export {
  RecommendationConsumed,
  RecommendationsExpired,
  RecommendationsGenerated,
  RecommendationSelected,
} from './domain/events/recommendation-events.js';

// Identifiers
export {
  RecommendationId,
  RecommendationReasonId,
  RecommendationScoreId,
  RecommendationSetId,
} from './domain/identifiers/recommendation-ids.js';

// Value Objects
export { ExpirationTime } from './domain/value-objects/expiration-time.js';
export { PriorityScore } from './domain/value-objects/priority-score.js';
export { RecommendationConfidence } from './domain/value-objects/recommendation-confidence.js';
export { RecommendationRank } from './domain/value-objects/recommendation-rank.js';
export { RecommendationWeight } from './domain/value-objects/recommendation-weight.js';

// Infrastructure / In-Memory
export {
  DefaultRecommendationPolicy,
  DefaultRecommendationRanker,
  DefaultRecommendationScorer,
  DefaultRecommendationStrategy,
} from './infrastructure/default-services.js';
export { InMemoryRecommendationRepository } from './infrastructure/repositories/in-memory-recommendation-repository.js';
