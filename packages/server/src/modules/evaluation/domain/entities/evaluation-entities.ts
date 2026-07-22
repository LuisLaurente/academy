import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { Entity } from '../../../../domain/entities/entity.js';
import type { ExerciseId, ExerciseType } from '../../../exercises/index.js';
import { InvalidSubmissionError } from '../errors/evaluation-errors.js';
import type { SubmissionId } from '../identifiers/evaluation-identifiers.js';
import type {
  ExecutionTime,
  FeedbackText,
  MemoryUsage,
  Score,
} from '../value-objects/evaluation-value-objects.js';

export interface SubmissionState {
  readonly answer: string;
  readonly exerciseId: ExerciseId;
  readonly exerciseType: ExerciseType;
  readonly id: SubmissionId;
  readonly submittedAt: Date;
}

export class Submission extends Entity<SubmissionId> {
  readonly answer: string;
  readonly exerciseId: ExerciseId;
  readonly exerciseType: ExerciseType;
  readonly #submittedAtEpoch: number;
  private constructor(state: SubmissionState) {
    super(state.id);
    this.answer = state.answer;
    this.exerciseId = state.exerciseId;
    this.exerciseType = state.exerciseType;
    this.#submittedAtEpoch = state.submittedAt.getTime();
    Object.freeze(this);
  }
  static create(state: SubmissionState): ResultType<Submission, InvalidSubmissionError> {
    const answer = state.answer.replace(/\r\n?/gu, '\n').trim();
    if (answer.length === 0 || answer.length > 100_000)
      return Result.failure(new InvalidSubmissionError('answer'));
    if (!Number.isFinite(state.submittedAt.getTime()))
      return Result.failure(new InvalidSubmissionError('submittedAt'));
    return Result.success(new Submission({ ...state, answer }));
  }
  get submittedAt(): Date {
    return new Date(this.#submittedAtEpoch);
  }
}

export class EvaluationResult {
  private constructor(
    readonly passed: boolean,
    readonly score: Score,
    readonly executionTime: ExecutionTime,
    readonly memoryUsage: MemoryUsage,
  ) {
    Object.freeze(this);
  }
  static create(
    passed: boolean,
    score: Score,
    executionTime: ExecutionTime,
    memoryUsage: MemoryUsage,
  ): EvaluationResult {
    return new EvaluationResult(passed, score, executionTime, memoryUsage);
  }
}

export class Feedback {
  private constructor(readonly text: FeedbackText) {
    Object.freeze(this);
  }
  static create(text: FeedbackText): Feedback {
    return new Feedback(text);
  }
}
