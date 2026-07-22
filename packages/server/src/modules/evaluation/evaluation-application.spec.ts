import { describe, expect, it } from 'vitest';
import type { Uuid, UuidService } from '../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../core/result/result.js';
import type { Clock } from '../../core/time/clock.js';
import { ExerciseId } from '../exercises/index.js';
import {
  CompleteEvaluation,
  EvaluationAlreadyCompletedError,
  EvaluationNotFoundError,
  EvaluationTimeoutError,
  FailEvaluation,
  FakeCodeRunner,
  FakeExerciseEvaluator,
  FakeOutputComparator,
  InMemoryEvaluationRepository,
  InMemoryEvaluationUnitOfWork,
  InvalidEvaluationValueError,
  InvalidSubmissionError,
  StartEvaluation,
  UnsupportedExerciseTypeError,
  type EvaluationError,
  type EvaluationUseCaseDependencies,
  type ExerciseEvaluationDecision,
} from './index.js';
import { EvaluationId } from './domain/identifiers/evaluation-identifiers.js';

class SequentialUuids implements UuidService {
  #value = 1;
  generate(): Uuid {
    return `30000000-0000-4000-8000-${String(this.#value++).padStart(12, '0')}` as Uuid;
  }
  isValid(candidate: string): candidate is Uuid {
    return /^[0-9a-f-]{36}$/u.test(candidate);
  }
}
class SequentialClock implements Clock {
  #second = 0;
  now(): Date {
    return new Date(Date.UTC(2026, 0, 1, 0, 0, this.#second++));
  }
}
const SUCCESS: ExerciseEvaluationDecision = Object.freeze({
  executionTimeMilliseconds: 12,
  feedback: 'The answer matches the expected behavior.',
  memoryUsageBytes: 2_048,
  passed: true,
  score: 100,
});
function setup(
  outcome: ResultType<ExerciseEvaluationDecision, EvaluationError> = Result.success(SUCCESS),
  supported: readonly ('Coding' | 'OutputPrediction')[] = ['Coding'],
): EvaluationUseCaseDependencies & {
  evaluator: FakeExerciseEvaluator;
  repository: InMemoryEvaluationRepository;
} {
  return {
    clock: new SequentialClock(),
    evaluator: new FakeExerciseEvaluator(supported, outcome),
    repository: new InMemoryEvaluationRepository(),
    unitOfWork: new InMemoryEvaluationUnitOfWork(),
    uuidService: new SequentialUuids(),
  };
}
async function started(dependencies: EvaluationUseCaseDependencies) {
  const result = await new StartEvaluation(dependencies).execute({
    answer: 'const answer = 42;',
    exerciseId: ExerciseId.create(dependencies.uuidService.generate()),
    exerciseType: 'Coding',
  });
  if (!result.isSuccess) throw result.error;
  return result.value;
}

describe('Evaluation application use cases', () => {
  it('starts and persists a supported evaluation', async () => {
    const dependencies = setup();
    const output = await started(dependencies);
    expect(output.status).toBe('started');
    expect(output.version).toBe(1);
    expect(dependencies.repository.size).toBe(1);
    expect(
      (await dependencies.repository.findBySubmissionId(output.submissionId))?.id.equals(
        output.evaluationId,
      ),
    ).toBe(true);
  });
  it('rejects unsupported exercise types before creating a submission', async () => {
    const dependencies = setup();
    const result = await new StartEvaluation(dependencies).execute({
      answer: 'answer',
      exerciseId: ExerciseId.create(dependencies.uuidService.generate()),
      exerciseType: 'Ordering',
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(UnsupportedExerciseTypeError);
    expect(dependencies.repository.size).toBe(0);
  });
  it.each(['', 'x'.repeat(100_001)])('rejects invalid submissions', async (answer) => {
    const dependencies = setup();
    const result = await new StartEvaluation(dependencies).execute({
      answer,
      exerciseId: ExerciseId.create(dependencies.uuidService.generate()),
      exerciseType: 'Coding',
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidSubmissionError);
  });
  it('completes using the evaluator decision and persists the terminal state', async () => {
    const dependencies = setup();
    const output = await started(dependencies);
    const completed = await new CompleteEvaluation(dependencies).execute({
      evaluationId: output.evaluationId,
    });
    expect(completed).toMatchObject({
      isSuccess: true,
      value: { status: 'completed', version: 2 },
    });
    const aggregate = await dependencies.repository.findById(output.evaluationId);
    expect(aggregate?.score?.value).toBe(100);
    expect(dependencies.evaluator.evaluatedSubmissions).toHaveLength(1);
  });
  it('propagates evaluator timeout without mutating the evaluation', async () => {
    const dependencies = setup(Result.failure(new EvaluationTimeoutError(1_000)));
    const output = await started(dependencies);
    const result = await new CompleteEvaluation(dependencies).execute({
      evaluationId: output.evaluationId,
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(EvaluationTimeoutError);
    expect((await dependencies.repository.findById(output.evaluationId))?.status).toBe('started');
  });
  it.each([
    { expectedField: 'score', patch: { score: 101 } },
    { expectedField: 'feedback', patch: { feedback: '' } },
    { expectedField: 'executionTime', patch: { executionTimeMilliseconds: -1 } },
    { expectedField: 'memoryUsage', patch: { memoryUsageBytes: -1 } },
  ])(
    'rejects invalid evaluator decision field $expectedField',
    async ({ expectedField, patch }) => {
      const dependencies = setup(Result.success({ ...SUCCESS, ...patch }));
      const output = await started(dependencies);
      const result = await new CompleteEvaluation(dependencies).execute({
        evaluationId: output.evaluationId,
      });
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(InvalidEvaluationValueError);
        expect(result.error.context.field).toBe(expectedField);
      }
    },
  );
  it('fails a started evaluation with feedback and reason', async () => {
    const dependencies = setup();
    const output = await started(dependencies);
    const failed = await new FailEvaluation(dependencies).execute({
      evaluationId: output.evaluationId,
      feedback: 'The evaluator is temporarily unavailable.',
      reason: 'evaluator-unavailable',
    });
    expect(failed).toMatchObject({ isSuccess: true, value: { status: 'failed', version: 2 } });
    expect((await dependencies.repository.findById(output.evaluationId))?.failureReason).toBe(
      'evaluator-unavailable',
    );
  });
  it('rejects invalid failure feedback before repository access', async () => {
    const dependencies = setup();
    const result = await new FailEvaluation(dependencies).execute({
      evaluationId: EvaluationId.create(dependencies.uuidService.generate()),
      feedback: '',
      reason: 'failure',
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidEvaluationValueError);
  });
  it('returns not found from complete and fail', async () => {
    const dependencies = setup();
    const evaluationId = EvaluationId.create(dependencies.uuidService.generate());
    const complete = await new CompleteEvaluation(dependencies).execute({ evaluationId });
    const fail = await new FailEvaluation(dependencies).execute({
      evaluationId,
      feedback: 'Evaluation could not be located.',
      reason: 'missing',
    });
    for (const result of [complete, fail]) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(EvaluationNotFoundError);
    }
  });
  it('rejects a second terminal transition', async () => {
    const dependencies = setup();
    const output = await started(dependencies);
    await new CompleteEvaluation(dependencies).execute({ evaluationId: output.evaluationId });
    const result = await new FailEvaluation(dependencies).execute({
      evaluationId: output.evaluationId,
      feedback: 'No second transition is allowed.',
      reason: 'second-transition',
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(EvaluationAlreadyCompletedError);
    const secondCompletion = await new CompleteEvaluation(dependencies).execute({
      evaluationId: output.evaluationId,
    });
    expect(secondCompletion.isSuccess).toBe(false);
    expect(dependencies.evaluator.evaluatedSubmissions).toHaveLength(1);
  });
});

describe('Evaluation in-memory adapters and fakes', () => {
  it('records deterministic fake code-runner requests without executing code', async () => {
    const outcome = Result.success({
      executionTimeMilliseconds: 5,
      memoryUsageBytes: 64,
      standardError: '',
      standardOutput: '42',
      timedOut: false,
    });
    const runner = new FakeCodeRunner(outcome);
    const result = await runner.run({
      code: 'print(42)',
      input: 'none',
      language: 'python',
      timeoutMilliseconds: 100,
    });
    expect(result).toBe(outcome);
    expect(runner.requests).toEqual([
      { code: 'print(42)', input: 'none', language: 'python', timeoutMilliseconds: 100 },
    ]);
  });
  it('can represent a deterministic code-runner failure', async () => {
    const outcome = Result.failure(new EvaluationTimeoutError(100));
    const runner = new FakeCodeRunner(outcome);
    expect(
      await runner.run({
        code: 'loop',
        input: 'none',
        language: 'python',
        timeoutMilliseconds: 100,
      }),
    ).toBe(outcome);
  });
  it('compares normalized output and protects input size', () => {
    const comparator = new FakeOutputComparator();
    const equal = comparator.compare('42\r\n', '42');
    const different = comparator.compare('41', '42');
    expect(equal.isSuccess && equal.value).toBe(true);
    expect(different.isSuccess && different.value).toBe(false);
    expect(comparator.compare('x'.repeat(100_001), '').isSuccess).toBe(false);
  });
  it('returns undefined for unknown repository indexes', async () => {
    const dependencies = setup();
    expect(
      await dependencies.repository.findById(
        EvaluationId.create(dependencies.uuidService.generate()),
      ),
    ).toBeUndefined();
  });
  it('serializes unit-of-work operations and recovers after rejection', async () => {
    const unit = new InMemoryEvaluationUnitOfWork();
    const calls: number[] = [];
    await expect(
      unit.execute(async () => {
        calls.push(1);
        throw new Error('failure');
      }),
    ).rejects.toThrow('failure');
    await unit.execute(async () => {
      calls.push(2);
    });
    expect(calls).toEqual([1, 2]);
  });
});
