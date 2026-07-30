// Application DTOs
export type {
  CompleteGenerationInput,
  CreateGenerationRequestInput,
  FailGenerationInput,
  StartGenerationInput,
} from './application/dtos/ai-orchestration-inputs.js';

// Application Ports
export type {
  GenerationExecutionResult,
  GenerationExecutor,
} from './application/ports/generation-executor.js';
export type { GenerationPolicy } from './application/ports/generation-policy.js';
export type { GenerationRepository } from './application/ports/generation-repository.js';
export type {
  GenerationResultRecord,
  GenerationResultStore,
} from './application/ports/generation-result-store.js';
export type { PromptProvider, PromptTemplateResult } from './application/ports/prompt-provider.js';

// Use Cases
export { CompleteGeneration } from './application/use-cases/complete-generation.js';
export { CreateGenerationRequest } from './application/use-cases/create-generation-request.js';
export { FailGeneration } from './application/use-cases/fail-generation.js';
export { StartGeneration } from './application/use-cases/start-generation.js';

// Aggregate
export {
  GenerationRequest,
  type CreateGenerationRequestProps,
  type GenerationRequestTimestamps,
  type RequestStatus,
} from './domain/aggregates/generation-request.js';

// Entities
export {
  GenerationArtifact,
  type CreateGenerationArtifactProps,
} from './domain/entities/generation-artifact.js';
export {
  GenerationMetadata,
  type CreateGenerationMetadataProps,
} from './domain/entities/generation-metadata.js';

// Errors
export {
  AIOrchestrationError,
  GenerationAlreadyCompletedError,
  GenerationAlreadyRunningError,
  GenerationLimitExceededError,
  GenerationRequestNotFoundError,
  InvalidGenerationTransitionError,
  InvalidGenerationValueError,
} from './domain/errors/ai-orchestration-errors.js';

// Events
export {
  GenerationCompleted,
  GenerationFailed,
  GenerationRequested,
  GenerationStarted,
} from './domain/events/ai-orchestration-events.js';

// Identifiers
export {
  AIRequestId,
  GenerationArtifactId,
  GenerationJobId,
  GenerationMetadataId,
} from './domain/identifiers/ai-orchestration-ids.js';

// Value Objects
export { GenerationAttempts } from './domain/value-objects/generation-attempts.js';
export { GenerationCost } from './domain/value-objects/generation-cost.js';
export { GenerationDuration } from './domain/value-objects/generation-duration.js';
export {
  GenerationPriority,
  type PriorityLevel,
} from './domain/value-objects/generation-priority.js';
export { PromptVersion } from './domain/value-objects/prompt-version.js';

// Infrastructure / In-Memory
export {
  DefaultGenerationExecutor,
  DefaultGenerationPolicy,
  DefaultPromptProvider,
  InMemoryGenerationResultStore,
} from './infrastructure/default-services.js';
export { InMemoryGenerationRepository } from './infrastructure/repositories/in-memory-generation-repository.js';
