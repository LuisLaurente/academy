import type { ExerciseId, ExerciseType } from '../../../exercises/index.js';
import type {
  EvaluationId,
  SubmissionId,
} from '../../domain/identifiers/evaluation-identifiers.js';
import type { EvaluationStatus } from '../../domain/types/evaluation-types.js';

export interface StartEvaluationInput {
  readonly answer: string;
  readonly exerciseId: ExerciseId;
  readonly exerciseType: ExerciseType;
}
export interface StartEvaluationOutput {
  readonly evaluationId: EvaluationId;
  readonly submissionId: SubmissionId;
  readonly status: EvaluationStatus;
  readonly version: number;
}
export interface CompleteEvaluationInput {
  readonly evaluationId: EvaluationId;
}
export interface FailEvaluationInput {
  readonly evaluationId: EvaluationId;
  readonly feedback: string;
  readonly reason: string;
}
export interface EvaluationTransitionOutput {
  readonly status: EvaluationStatus;
  readonly version: number;
}
