import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type { ExerciseType } from '../../../exercises/index.js';
import type { Evaluation } from '../../domain/aggregates/evaluation.js';
import type { Submission } from '../../domain/entities/evaluation-entities.js';
import {
  InvalidSubmissionError,
  type EvaluationError,
} from '../../domain/errors/evaluation-errors.js';
import type {
  EvaluationId,
  SubmissionId,
} from '../../domain/identifiers/evaluation-identifiers.js';
import type {
  CodeRunRequest,
  CodeRunner,
  CodeRunResult,
  EvaluationRepository,
  ExerciseEvaluationDecision,
  ExerciseEvaluator,
  OutputComparator,
} from '../../application/ports/evaluation-ports.js';

export class InMemoryEvaluationRepository implements EvaluationRepository {
  readonly #evaluations = new Map<string, Evaluation>();
  readonly #bySubmission = new Map<string, string>();
  findById(id: EvaluationId): Promise<Evaluation | undefined> {
    return Promise.resolve(this.#evaluations.get(id.toString()));
  }
  findBySubmissionId(id: SubmissionId): Promise<Evaluation | undefined> {
    const evaluationId = this.#bySubmission.get(id.toString());
    return Promise.resolve(evaluationId ? this.#evaluations.get(evaluationId) : undefined);
  }
  save(evaluation: Evaluation): Promise<void> {
    this.#evaluations.set(evaluation.id.toString(), evaluation);
    this.#bySubmission.set(evaluation.submission.id.toString(), evaluation.id.toString());
    return Promise.resolve();
  }
  get size(): number {
    return this.#evaluations.size;
  }
}

export class InMemoryEvaluationUnitOfWork implements UnitOfWork {
  #pending: Promise<void> = Promise.resolve();
  execute<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    const execution = this.#pending.then(work, work);
    this.#pending = execution.then(
      () => undefined,
      () => undefined,
    );
    return execution;
  }
}

export class FakeExerciseEvaluator implements ExerciseEvaluator {
  readonly evaluatedSubmissions: Submission[] = [];
  constructor(
    private readonly supportedTypes: readonly ExerciseType[],
    private readonly outcome: ResultType<ExerciseEvaluationDecision, EvaluationError>,
  ) {}
  supports(exerciseType: ExerciseType): boolean {
    return this.supportedTypes.includes(exerciseType);
  }
  evaluate(
    submission: Submission,
  ): Promise<ResultType<ExerciseEvaluationDecision, EvaluationError>> {
    this.evaluatedSubmissions.push(submission);
    return Promise.resolve(this.outcome);
  }
}

export class FakeCodeRunner implements CodeRunner {
  readonly requests: CodeRunRequest[] = [];
  constructor(private readonly outcome: ResultType<CodeRunResult, EvaluationError>) {}
  run(request: CodeRunRequest): Promise<ResultType<CodeRunResult, EvaluationError>> {
    this.requests.push(Object.freeze({ ...request }));
    return Promise.resolve(this.outcome);
  }
}

export class FakeOutputComparator implements OutputComparator {
  compare(actual: string, expected: string): ResultType<boolean, EvaluationError> {
    if (actual.length > 100_000 || expected.length > 100_000)
      return Result.failure(new InvalidSubmissionError('comparatorInput'));
    return Result.success(normalize(actual) === normalize(expected));
  }
}
function normalize(value: string): string {
  return value.replace(/\r\n?/gu, '\n').trimEnd();
}
