// Application DTOs
export type {
  CalculateMasteryInput,
  CreateLearningRecordInput,
  ScheduleReviewInput,
  UpdateLearningProgressInput,
} from './application/dtos/learning-inputs.js';

// Application Ports
export type { LearningPolicy } from './application/ports/learning-policy.js';
export type { LearningRepository } from './application/ports/learning-repository.js';
export type { MasteryCalculator } from './application/ports/mastery-calculator.js';
export type { RetentionCalculator } from './application/ports/retention-calculator.js';
export type {
  ReviewScheduler,
  ScheduledReviewResult,
} from './application/ports/review-scheduler.js';

// Use Cases
export { CalculateMastery } from './application/use-cases/calculate-mastery.js';
export { CreateLearningRecord } from './application/use-cases/create-learning-record.js';
export { ScheduleReview } from './application/use-cases/schedule-review.js';
export { UpdateLearningProgress } from './application/use-cases/update-learning-progress.js';

// Aggregate
export {
  LearningRecord,
  type CreateLearningRecordProps,
  type EventContext,
  type LearningRecordTimestamps,
} from './domain/aggregates/learning-record.js';

// Entities
export {
  LearningMetrics,
  type CreateLearningMetricsProps,
} from './domain/entities/learning-metrics.js';
export { ReviewHistory, type CreateReviewHistoryProps } from './domain/entities/review-history.js';

// Errors
export {
  InvalidAttemptCountError,
  InvalidLearningTransitionError,
  InvalidMasteryScoreError,
  InvalidReviewIntervalError,
  InvalidScoreValueError,
  LearningError,
  LearningRecordLockedError,
  LearningRecordNotFoundError,
  ReviewNotDueError,
} from './domain/errors/learning-errors.js';

// Events
export {
  LearningProgressUpdated,
  LearningRecordCreated,
  MasteryReached,
  ReviewScheduled,
  type LearningProgressUpdatedPayload,
  type LearningRecordCreatedPayload,
  type MasteryReachedPayload,
  type ReviewScheduledPayload,
} from './domain/events/learning-events.js';

// Identifiers
export {
  LearningMetricsId,
  LearningRecordId,
  ReviewHistoryId,
  StudentId,
} from './domain/identifiers/learning-ids.js';

// Value Objects
export { AttemptCount } from './domain/value-objects/attempt-count.js';
export { ConfidenceScore } from './domain/value-objects/confidence-score.js';
export { MasteryScore } from './domain/value-objects/mastery-score.js';
export { RetentionScore } from './domain/value-objects/retention-score.js';
export { ReviewInterval } from './domain/value-objects/review-interval.js';
export { SuccessRate } from './domain/value-objects/success-rate.js';

// Infrastructure / In-Memory
export {
  DefaultLearningPolicy,
  DefaultMasteryCalculator,
  DefaultRetentionCalculator,
  DefaultReviewScheduler,
} from './infrastructure/default-services.js';
export { InMemoryLearningRepository } from './infrastructure/repositories/in-memory-learning-repository.js';
