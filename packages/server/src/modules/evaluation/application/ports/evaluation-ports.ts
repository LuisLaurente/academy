import type { Result } from '../../../../core/result/result.js';
import type { ExerciseType } from '../../../exercises/index.js';
import type { Evaluation } from '../../domain/aggregates/evaluation.js';
import type { Submission } from '../../domain/entities/evaluation-entities.js';
import type { EvaluationError } from '../../domain/errors/evaluation-errors.js';
import type {
  EvaluationId,
  SubmissionId,
} from '../../domain/identifiers/evaluation-identifiers.js';

export interface EvaluationRepository {
  findById(id: EvaluationId): Promise<Evaluation | undefined>;
  findBySubmissionId(id: SubmissionId): Promise<Evaluation | undefined>;
  save(evaluation: Evaluation): Promise<void>;
}
export interface ExerciseEvaluationDecision {
  readonly executionTimeMilliseconds: number;
  readonly feedback: string;
  readonly memoryUsageBytes: number;
  readonly passed: boolean;
  readonly score: number;
}
export interface ExerciseEvaluator {
  evaluate(submission: Submission): Promise<Result<ExerciseEvaluationDecision, EvaluationError>>;
  supports(exerciseType: ExerciseType): boolean;
}
export interface CodeRunRequest {
  readonly code: string;
  readonly input: string;
  readonly language: string;
  readonly timeoutMilliseconds: number;
}
export interface CodeRunResult {
  readonly executionTimeMilliseconds: number;
  readonly memoryUsageBytes: number;
  readonly standardError: string;
  readonly standardOutput: string;
  readonly timedOut: boolean;
}
export interface CodeRunner {
  run(request: CodeRunRequest): Promise<Result<CodeRunResult, EvaluationError>>;
}
export interface OutputComparator {
  compare(actual: string, expected: string): Result<boolean, EvaluationError>;
}
