// Application DTOs
export type {
  CompleteLearningWorkflowInput,
  ExecuteLearningStepInput,
  FailLearningWorkflowInput,
  StartLearningWorkflowInput,
} from './application/dtos/workflow-inputs.js';

// Application Ports
export type {
  EvaluationCoordinator,
  EvaluationCoordinatorResult,
} from './application/ports/evaluation-coordinator.js';
export type {
  GenerationCoordinator,
  GenerationCoordinatorResult,
} from './application/ports/generation-coordinator.js';
export type { LearningFlowPolicy } from './application/ports/learning-flow-policy.js';
export type {
  RecommendationCoordinator,
  RecommendationCoordinatorResult,
} from './application/ports/recommendation-coordinator.js';
export type {
  SessionCoordinator,
  SessionCoordinatorResult,
} from './application/ports/session-coordinator.js';
export type { WorkflowRepository } from './application/ports/workflow-repository.js';

// Use Cases
export { CompleteLearningWorkflow } from './application/use-cases/complete-learning-workflow.js';
export { ExecuteLearningStep } from './application/use-cases/execute-learning-step.js';
export { FailLearningWorkflow } from './application/use-cases/fail-learning-workflow.js';
export { StartLearningWorkflow } from './application/use-cases/start-learning-workflow.js';

// Aggregate
export {
  LearningWorkflow,
  type LearningWorkflowTimestamps,
  type StartLearningWorkflowProps,
} from './domain/aggregates/learning-workflow.js';

// Entities
export {
  WorkflowResult,
  type CreateWorkflowResultProps,
} from './domain/entities/workflow-result.js';
export {
  WorkflowStepExecution,
  type CreateWorkflowStepExecutionProps,
  type StepExecutionStatus,
} from './domain/entities/workflow-step-execution.js';

// Errors
export {
  ApplicationWorkflowError,
  InvalidWorkflowTransitionError,
  InvalidWorkflowValueError,
  WorkflowAlreadyCompletedError,
  WorkflowExecutionFailedError,
  WorkflowNotFoundError,
} from './domain/errors/application-errors.js';

// Events
export {
  WorkflowCompleted,
  WorkflowFailed,
  WorkflowStarted,
  WorkflowStepCompleted,
} from './domain/events/application-events.js';

// Identifiers
export {
  ApplicationFlowId,
  WorkflowExecutionId,
  WorkflowResultId,
} from './domain/identifiers/application-ids.js';

// Value Objects
export { ExecutionDuration } from './domain/value-objects/execution-duration.js';
export {
  WorkflowStatus,
  type WorkflowStatusState,
} from './domain/value-objects/workflow-status.js';
export { WorkflowStep, type StepName } from './domain/value-objects/workflow-step.js';

// Infrastructure / In-Memory
export {
  DefaultLearningFlowPolicy,
  FakeEvaluationCoordinator,
  FakeGenerationCoordinator,
  FakeRecommendationCoordinator,
  FakeSessionCoordinator,
} from './infrastructure/default-coordinators.js';
export { InMemoryWorkflowRepository } from './infrastructure/repositories/in-memory-workflow-repository.js';
