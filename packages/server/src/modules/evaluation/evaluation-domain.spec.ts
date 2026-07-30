import { describe, expect, it } from 'vitest';
import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { ExerciseId } from '../exercises/index.js';
import { Evaluation } from './domain/aggregates/evaluation.js';
import { EvaluationResult, Feedback, Submission } from './domain/entities/evaluation-entities.js';
import {
  EvaluationAlreadyCompletedError,
  EvaluationTimeoutError,
  InvalidEvaluationDateError,
  InvalidEvaluationValueError,
  InvalidSubmissionError,
  UnsupportedExerciseTypeError,
} from './index.js';
import {
  EvaluationCompleted,
  EvaluationFailed,
  EvaluationStarted,
} from './domain/events/evaluation-events.js';
import { EvaluationId, SubmissionId } from './domain/identifiers/evaluation-identifiers.js';
import {
  ExecutionTime,
  FeedbackText,
  MemoryUsage,
  Score,
} from './domain/value-objects/evaluation-value-objects.js';

let sequence = 1;
function uuid(): Uuid {
  return `20000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}` as Uuid;
}
function value<T, E>(
  result:
    | { readonly isSuccess: true; readonly value: T }
    | { readonly error: E; readonly isSuccess: false },
): T {
  if (!result.isSuccess) throw result.error;
  return result.value;
}
function failure<T, E>(
  result:
    | { readonly isSuccess: true; readonly value: T }
    | { readonly error: E; readonly isSuccess: false },
): E {
  if (result.isSuccess) throw new Error('Expected failure.');
  return result.error;
}
function date(second = 0): Date {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, second));
}
function submission(answer = 'const answer = 42;'): Submission {
  return value(
    Submission.create({
      answer,
      exerciseId: ExerciseId.create(uuid()),
      exerciseType: 'Coding',
      id: SubmissionId.create(uuid()),
      submittedAt: date(),
    }),
  );
}
function evaluation(): Evaluation {
  return Evaluation.start({
    eventId: uuid(),
    id: EvaluationId.create(uuid()),
    startedAt: date(),
    submission: submission(),
  });
}
function feedback(text = 'The response was evaluated deterministically.'): Feedback {
  return Feedback.create(value(FeedbackText.create(text)));
}
function result(score = 100): EvaluationResult {
  return EvaluationResult.create(
    score > 0,
    value(Score.create(score)),
    value(ExecutionTime.create(25)),
    value(MemoryUsage.create(1024)),
  );
}
function transition(second = 1) {
  return { eventId: uuid(), occurredAt: date(second) };
}

describe('Evaluation value objects', () => {
  it.each([[0], [50.5], [100]])('creates scores within boundaries', (candidate) =>
    expect(Score.create(candidate).isSuccess).toBe(true),
  );
  it.each([[-1], [101], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    'rejects invalid scores',
    (candidate) => expect(Score.create(candidate).isSuccess).toBe(false),
  );
  it('normalizes feedback and provides value semantics', () => {
    const left = value(FeedbackText.create('  Useful feedback\r\nline  '));
    const right = value(FeedbackText.create('Useful feedback\nline'));
    expect(left.equals(right)).toBe(true);
    expect(left.toString()).toBe('Useful feedback\nline');
  });
  it.each(['', 'x'.repeat(4_001)])('rejects invalid feedback text', (candidate) =>
    expect(FeedbackText.create(candidate).isSuccess).toBe(false),
  );
  it.each([0, 3_600_000])('creates execution-time boundaries', (candidate) =>
    expect(ExecutionTime.create(candidate).isSuccess).toBe(true),
  );
  it.each([-1, 1.5, 3_600_001])('rejects invalid execution times', (candidate) =>
    expect(ExecutionTime.create(candidate).isSuccess).toBe(false),
  );
  it.each([0, 1_024, Number.MAX_SAFE_INTEGER])('creates memory-usage values', (candidate) =>
    expect(MemoryUsage.create(candidate).isSuccess).toBe(true),
  );
  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid memory usage', (candidate) =>
    expect(MemoryUsage.create(candidate).isSuccess).toBe(false),
  );
  it('compares every numeric value object by value', () => {
    expect(value(Score.create(80)).equals(value(Score.create(80)))).toBe(true);
    expect(value(ExecutionTime.create(20)).equals(value(ExecutionTime.create(20)))).toBe(true);
    expect(value(MemoryUsage.create(20)).equals(value(MemoryUsage.create(20)))).toBe(true);
  });
});

describe('Submission and evaluation entities', () => {
  it('normalizes an immutable submission and protects its timestamp', () => {
    const item = submission('  answer\r\nline  ');
    const exposed = item.submittedAt;
    exposed.setUTCFullYear(2000);
    expect(item.answer).toBe('answer\nline');
    expect(item.submittedAt.getUTCFullYear()).toBe(2026);
    expect(Object.isFrozen(item)).toBe(true);
  });
  it.each(['', 'x'.repeat(100_001)])('rejects invalid submission answers', (answer) =>
    expect(
      Submission.create({
        answer,
        exerciseId: ExerciseId.create(uuid()),
        exerciseType: 'Coding',
        id: SubmissionId.create(uuid()),
        submittedAt: date(),
      }).isSuccess,
    ).toBe(false),
  );
  it('rejects an invalid submission timestamp', () =>
    expect(
      Submission.create({
        answer: 'answer',
        exerciseId: ExerciseId.create(uuid()),
        exerciseType: 'Coding',
        id: SubmissionId.create(uuid()),
        submittedAt: new Date('invalid'),
      }).isSuccess,
    ).toBe(false));
  it('creates immutable result and feedback entities', () => {
    expect(Object.isFrozen(result())).toBe(true);
    expect(Object.isFrozen(feedback())).toBe(true);
  });
});

describe('Evaluation aggregate', () => {
  it('starts with no result and records EvaluationStarted', () => {
    const aggregate = evaluation();
    expect(aggregate.status).toBe('started');
    expect(aggregate.result).toBeUndefined();
    expect(aggregate.score).toBeUndefined();
    expect(aggregate.pendingDomainEvents[0]).toBeInstanceOf(EvaluationStarted);
    expect(aggregate.aggregateVersion).toBe(1);
  });
  it('completes atomically and records score, feedback and event', () => {
    const aggregate = evaluation();
    const completed = aggregate.complete(result(85), feedback(), transition());
    expect(completed.isSuccess).toBe(true);
    expect(aggregate.status).toBe('completed');
    expect(aggregate.score?.value).toBe(85);
    expect(aggregate.feedback?.text.value).toContain('evaluated');
    expect(aggregate.pendingDomainEvents.at(-1)).toBeInstanceOf(EvaluationCompleted);
    const exposed = aggregate.completedAt!;
    exposed.setUTCFullYear(2000);
    expect(aggregate.completedAt?.getUTCFullYear()).toBe(2026);
  });
  it('fails atomically with a normalized reason and event', () => {
    const aggregate = evaluation();
    expect(
      aggregate.fail(
        '  runner-unavailable  ',
        feedback('Evaluation could not finish.'),
        transition(),
      ).isSuccess,
    ).toBe(true);
    expect(aggregate.status).toBe('failed');
    expect(aggregate.result).toBeUndefined();
    expect(aggregate.failureReason).toBe('runner-unavailable');
    expect(aggregate.pendingDomainEvents.at(-1)).toBeInstanceOf(EvaluationFailed);
  });
  it.each(['', 'x'.repeat(201)])(
    'rejects invalid failure reasons without changing state',
    (reason) => {
      const aggregate = evaluation();
      expect(failure(aggregate.fail(reason, feedback(), transition()))).toBeInstanceOf(
        InvalidEvaluationValueError,
      );
      expect(aggregate.status).toBe('started');
    },
  );
  it('rejects every transition after completion or failure', () => {
    const completed = evaluation();
    completed.complete(result(), feedback(), transition());
    expect(failure(completed.complete(result(), feedback(), transition(2)))).toBeInstanceOf(
      EvaluationAlreadyCompletedError,
    );
    expect(failure(completed.fail('failure', feedback(), transition(2)))).toBeInstanceOf(
      EvaluationAlreadyCompletedError,
    );
    const failed = evaluation();
    failed.fail('failure', feedback(), transition());
    expect(failure(failed.complete(result(), feedback(), transition(2)))).toBeInstanceOf(
      EvaluationAlreadyCompletedError,
    );
  });
  it('rejects non-monotonic and invalid transition dates', () => {
    const aggregate = evaluation();
    expect(() => aggregate.complete(result(), feedback(), transition(-1))).toThrow(
      InvalidEvaluationDateError,
    );
    expect(() =>
      aggregate.complete(result(), feedback(), {
        eventId: uuid(),
        occurredAt: new Date('invalid'),
      }),
    ).toThrow(InvalidEvaluationDateError);
  });
  it('validates every rehydrated state shape', () => {
    const aggregate = evaluation();
    const base = {
      aggregateVersion: 1,
      completedAt: undefined,
      failureReason: undefined,
      feedback: undefined,
      id: aggregate.id,
      result: undefined,
      startedAt: aggregate.startedAt,
      status: 'started' as const,
      submission: aggregate.submission,
      updatedAt: aggregate.updatedAt,
    };
    expect(() => Evaluation.rehydrate({ ...base, aggregateVersion: 0 })).toThrow(
      InvalidEvaluationValueError,
    );
    expect(() => Evaluation.rehydrate({ ...base, status: 'unknown' as 'started' })).toThrow(
      InvalidEvaluationValueError,
    );
    expect(() => Evaluation.rehydrate({ ...base, startedAt: new Date('invalid') })).toThrow(
      InvalidEvaluationDateError,
    );
    expect(() => Evaluation.rehydrate({ ...base, updatedAt: date(-1) })).toThrow(
      InvalidEvaluationDateError,
    );
    expect(() => Evaluation.rehydrate({ ...base, feedback: feedback() })).toThrow(
      InvalidEvaluationValueError,
    );
    expect(() => Evaluation.rehydrate({ ...base, status: 'completed' })).toThrow(
      InvalidEvaluationValueError,
    );
    expect(() => Evaluation.rehydrate({ ...base, status: 'failed' })).toThrow(
      InvalidEvaluationValueError,
    );
    expect(() =>
      Evaluation.rehydrate({
        ...base,
        completedAt: date(2),
        feedback: feedback(),
        result: result(),
        status: 'completed',
        updatedAt: date(1),
      }),
    ).toThrow(InvalidEvaluationDateError);
    expect(() =>
      Evaluation.rehydrate({
        ...base,
        completedAt: new Date('invalid'),
        feedback: feedback(),
        result: result(),
        status: 'completed',
        updatedAt: date(1),
      }),
    ).toThrow(InvalidEvaluationDateError);
  });
  it('rehydrates valid completed and failed evaluations', () => {
    const aggregate = evaluation();
    const common = {
      aggregateVersion: 2,
      completedAt: date(1),
      id: aggregate.id,
      startedAt: date(),
      submission: aggregate.submission,
      updatedAt: date(1),
    };
    expect(
      Evaluation.rehydrate({
        ...common,
        failureReason: undefined,
        feedback: feedback(),
        result: result(),
        status: 'completed',
      }).status,
    ).toBe('completed');
    expect(
      Evaluation.rehydrate({
        ...common,
        failureReason: 'timeout',
        feedback: feedback(),
        result: undefined,
        status: 'failed',
      }).status,
    ).toBe('failed');
  });
});

describe('required evaluation errors', () => {
  it('exposes stable codes and safe context', () => {
    const errors = [
      new InvalidSubmissionError('answer'),
      new EvaluationAlreadyCompletedError('completed'),
      new UnsupportedExerciseTypeError('Ordering'),
      new EvaluationTimeoutError(1_000),
    ];
    expect(errors.map((error) => error.code)).toEqual([
      'evaluation.invalid-submission',
      'evaluation.already-completed',
      'evaluation.unsupported-exercise-type',
      'evaluation.timeout',
    ]);
    expect(errors.every((error) => Object.isFrozen(error.context))).toBe(true);
  });
});
