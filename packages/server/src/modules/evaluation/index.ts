export type {
  CompleteEvaluationInput,
  EvaluationTransitionOutput,
  FailEvaluationInput,
  StartEvaluationInput,
  StartEvaluationOutput,
} from './application/dtos/evaluation-commands.js';
export type {
  CodeRunRequest,
  CodeRunner,
  CodeRunResult,
  EvaluationRepository,
  ExerciseEvaluationDecision,
  ExerciseEvaluator,
  OutputComparator,
} from './application/ports/evaluation-ports.js';
export {
  CompleteEvaluation,
  FailEvaluation,
  StartEvaluation,
  type EvaluationUseCaseDependencies,
} from './application/use-cases/evaluation-use-cases.js';
export {
  Evaluation,
  type EvaluationState,
  type EvaluationTransition,
} from './domain/aggregates/evaluation.js';
export {
  EvaluationResult,
  Feedback,
  Submission,
  type SubmissionState,
} from './domain/entities/evaluation-entities.js';
export {
  EvaluationAlreadyCompletedError,
  EvaluationError,
  EvaluationNotFoundError,
  EvaluationTimeoutError,
  InvalidEvaluationDateError,
  InvalidEvaluationValueError,
  InvalidSubmissionError,
  UnsupportedExerciseTypeError,
} from './domain/errors/evaluation-errors.js';
export {
  EvaluationCompleted,
  EvaluationFailed,
  EvaluationStarted,
  type EvaluationEventEnvelope,
} from './domain/events/evaluation-events.js';
export { EvaluationId, SubmissionId } from './domain/identifiers/evaluation-identifiers.js';
export type { EvaluationStatus } from './domain/types/evaluation-types.js';
export {
  ExecutionTime,
  FeedbackText,
  MemoryUsage,
  Score,
} from './domain/value-objects/evaluation-value-objects.js';
export {
  FakeCodeRunner,
  FakeExerciseEvaluator,
  FakeOutputComparator,
  InMemoryEvaluationRepository,
  InMemoryEvaluationUnitOfWork,
} from './infrastructure/testing/fake-evaluation.js';
