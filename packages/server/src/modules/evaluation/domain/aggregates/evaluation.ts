import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { EvaluationResult, Feedback, Submission } from '../entities/evaluation-entities.js';
import {
  EvaluationAlreadyCompletedError,
  InvalidEvaluationDateError,
  InvalidEvaluationValueError,
  type EvaluationError,
} from '../errors/evaluation-errors.js';
import {
  EvaluationCompleted,
  EvaluationFailed,
  EvaluationStarted,
} from '../events/evaluation-events.js';
import type { EvaluationId } from '../identifiers/evaluation-identifiers.js';
import type { EvaluationStatus } from '../types/evaluation-types.js';
import type { Score } from '../value-objects/evaluation-value-objects.js';

export interface EvaluationTransition {
  readonly eventId: Uuid;
  readonly occurredAt: Date;
}
export interface EvaluationState {
  readonly aggregateVersion: number;
  readonly completedAt: Date | undefined;
  readonly failureReason: string | undefined;
  readonly feedback: Feedback | undefined;
  readonly id: EvaluationId;
  readonly result: EvaluationResult | undefined;
  readonly startedAt: Date;
  readonly status: EvaluationStatus;
  readonly submission: Submission;
  readonly updatedAt: Date;
}

export class Evaluation extends AggregateRoot<EvaluationId> {
  readonly submission: Submission;
  readonly #startedAtEpoch: number;
  #updatedAtEpoch: number;
  #completedAtEpoch: number | undefined;
  #aggregateVersion: number;
  #status: EvaluationStatus;
  #result: EvaluationResult | undefined;
  #feedback: Feedback | undefined;
  #failureReason: string | undefined;

  private constructor(state: EvaluationState) {
    super(state.id);
    assertDate(state.startedAt, 'startedAt');
    assertDate(state.updatedAt, 'updatedAt');
    if (state.updatedAt.getTime() < state.startedAt.getTime())
      throw new InvalidEvaluationDateError('updatedAt');
    if (!Number.isSafeInteger(state.aggregateVersion) || state.aggregateVersion < 1)
      throw new InvalidEvaluationValueError('aggregateVersion');
    validateState(state);
    this.submission = state.submission;
    this.#startedAtEpoch = state.startedAt.getTime();
    this.#updatedAtEpoch = state.updatedAt.getTime();
    this.#completedAtEpoch = state.completedAt?.getTime();
    this.#aggregateVersion = state.aggregateVersion;
    this.#status = state.status;
    this.#result = state.result;
    this.#feedback = state.feedback;
    this.#failureReason = state.failureReason;
  }
  static start(state: {
    readonly eventId: Uuid;
    readonly id: EvaluationId;
    readonly startedAt: Date;
    readonly submission: Submission;
  }): Evaluation {
    const evaluation = new Evaluation({
      aggregateVersion: 1,
      completedAt: undefined,
      failureReason: undefined,
      feedback: undefined,
      id: state.id,
      result: undefined,
      startedAt: state.startedAt,
      status: 'started',
      submission: state.submission,
      updatedAt: state.startedAt,
    });
    evaluation.recordDomainEvent(
      new EvaluationStarted(
        evaluation.envelope({ eventId: state.eventId, occurredAt: state.startedAt }),
        state.submission.id,
        state.submission.exerciseId.toString(),
      ),
    );
    return evaluation;
  }
  static rehydrate(state: EvaluationState): Evaluation {
    return new Evaluation(state);
  }
  get aggregateVersion(): number {
    return this.#aggregateVersion;
  }
  get status(): EvaluationStatus {
    return this.#status;
  }
  get result(): EvaluationResult | undefined {
    return this.#result;
  }
  get score(): Score | undefined {
    return this.#result?.score;
  }
  get feedback(): Feedback | undefined {
    return this.#feedback;
  }
  get failureReason(): string | undefined {
    return this.#failureReason;
  }
  get startedAt(): Date {
    return new Date(this.#startedAtEpoch);
  }
  get updatedAt(): Date {
    return new Date(this.#updatedAtEpoch);
  }
  get completedAt(): Date | undefined {
    return this.#completedAtEpoch === undefined ? undefined : new Date(this.#completedAtEpoch);
  }

  complete(
    result: EvaluationResult,
    feedback: Feedback,
    transition: EvaluationTransition,
  ): ResultType<void, EvaluationError> {
    const pending = this.ensurePending();
    if (!pending.isSuccess) return pending;
    this.commit(transition);
    this.#status = 'completed';
    this.#result = result;
    this.#feedback = feedback;
    this.#completedAtEpoch = transition.occurredAt.getTime();
    this.recordDomainEvent(
      new EvaluationCompleted(this.envelope(transition), result.passed, result.score.value),
    );
    return Result.success(undefined);
  }
  fail(
    reason: string,
    feedback: Feedback,
    transition: EvaluationTransition,
  ): ResultType<void, EvaluationError> {
    const pending = this.ensurePending();
    if (!pending.isSuccess) return pending;
    const preparedReason = reason.trim();
    if (preparedReason.length === 0 || preparedReason.length > 200)
      return Result.failure(new InvalidEvaluationValueError('failureReason'));
    this.commit(transition);
    this.#status = 'failed';
    this.#feedback = feedback;
    this.#failureReason = preparedReason;
    this.#completedAtEpoch = transition.occurredAt.getTime();
    this.recordDomainEvent(new EvaluationFailed(this.envelope(transition), preparedReason));
    return Result.success(undefined);
  }
  private ensurePending(): ResultType<void, EvaluationAlreadyCompletedError> {
    return this.#status === 'started'
      ? Result.success(undefined)
      : Result.failure(new EvaluationAlreadyCompletedError(this.#status));
  }
  private commit(transition: EvaluationTransition): void {
    assertDate(transition.occurredAt, 'occurredAt');
    if (transition.occurredAt.getTime() < this.#updatedAtEpoch)
      throw new InvalidEvaluationDateError('occurredAt');
    this.#updatedAtEpoch = transition.occurredAt.getTime();
    this.#aggregateVersion += 1;
  }
  private envelope(transition: EvaluationTransition) {
    return {
      aggregateId: this.id,
      aggregateVersion: this.#aggregateVersion,
      eventId: transition.eventId,
      occurredAt: transition.occurredAt,
    };
  }
}

function validateState(state: EvaluationState): void {
  if (state.status !== 'started' && state.status !== 'completed' && state.status !== 'failed')
    throw new InvalidEvaluationValueError('status');
  if (state.completedAt !== undefined) {
    assertDate(state.completedAt, 'completedAt');
    if (
      state.completedAt.getTime() < state.startedAt.getTime() ||
      state.completedAt.getTime() !== state.updatedAt.getTime()
    )
      throw new InvalidEvaluationDateError('completedAt');
  }
  if (
    state.status === 'started' &&
    (state.completedAt !== undefined ||
      state.result !== undefined ||
      state.feedback !== undefined ||
      state.failureReason !== undefined)
  )
    throw new InvalidEvaluationValueError('startedState');
  if (
    state.status === 'completed' &&
    (state.completedAt === undefined ||
      state.result === undefined ||
      state.feedback === undefined ||
      state.failureReason !== undefined)
  )
    throw new InvalidEvaluationValueError('completedState');
  if (
    state.status === 'failed' &&
    (state.completedAt === undefined ||
      state.result !== undefined ||
      state.feedback === undefined ||
      !state.failureReason)
  )
    throw new InvalidEvaluationValueError('failedState');
}
function assertDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) throw new InvalidEvaluationDateError(field);
}
