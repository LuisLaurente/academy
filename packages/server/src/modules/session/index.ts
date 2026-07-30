// Application DTOs
export type {
  CompleteSessionItemInput,
  FinishSessionInput,
  SkipSessionItemInput,
  StartSessionInput,
} from './application/dtos/session-inputs.js';

// Application Ports
export type { SessionBuilder, SessionCandidateItem } from './application/ports/session-builder.js';
export type { SessionPolicy } from './application/ports/session-policy.js';
export type { SessionProgressCalculator } from './application/ports/session-progress-calculator.js';
export type { SessionRepository } from './application/ports/session-repository.js';

// Use Cases
export { CompleteSessionItem } from './application/use-cases/complete-session-item.js';
export { FinishSession } from './application/use-cases/finish-session.js';
export { SkipSessionItem } from './application/use-cases/skip-session-item.js';
export { StartSession } from './application/use-cases/start-session.js';

// Aggregate
export {
  LearningSession,
  type LearningSessionTimestamps,
  type SessionStatus,
  type StartLearningSessionProps,
} from './domain/aggregates/learning-session.js';

// Entities
export {
  SessionItem,
  type CreateSessionItemProps,
  type SessionItemStatus,
} from './domain/entities/session-item.js';
export {
  SessionStatistics,
  type CreateSessionStatisticsProps,
} from './domain/entities/session-statistics.js';

// Errors
export {
  InvalidSessionTransitionError,
  InvalidSessionValueError,
  SessionAlreadyFinishedError,
  SessionError,
  SessionItemNotFoundError,
  SessionNotFoundError,
  SessionNotStartedError,
} from './domain/errors/session-errors.js';

// Events
export {
  SessionFinished,
  SessionItemCompleted,
  SessionItemSkipped,
  SessionStarted,
} from './domain/events/session-events.js';

// Identifiers
export { SessionId, SessionItemId, SessionStatisticsId } from './domain/identifiers/session-ids.js';

// Value Objects
export { CompletedCount } from './domain/value-objects/completed-count.js';
export { CompletionRate } from './domain/value-objects/completion-rate.js';
export { SessionDuration } from './domain/value-objects/session-duration.js';
export {
  SessionProgress,
  type CreateSessionProgressProps,
} from './domain/value-objects/session-progress.js';
export { SkippedCount } from './domain/value-objects/skipped-count.js';

// Infrastructure / In-Memory
export {
  DefaultSessionBuilder,
  DefaultSessionPolicy,
  DefaultSessionProgressCalculator,
} from './infrastructure/default-services.js';
export { InMemorySessionRepository } from './infrastructure/repositories/in-memory-session-repository.js';
