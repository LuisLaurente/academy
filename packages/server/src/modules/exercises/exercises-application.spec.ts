import { describe, expect, it } from 'vitest';
import type { Uuid, UuidService } from '../../core/identifiers/uuid-service.js';
import type { Clock } from '../../core/time/clock.js';
import { LessonId } from '../curriculum/index.js';
import {
  AddExercise,
  AddHint,
  AddSolution,
  CreateExerciseSet,
  PublishExerciseSet,
  ExerciseNotFoundError,
  ExerciseSetAlreadyExistsError,
  ExerciseSetNotFoundError,
  InMemoryExerciseSetRepository,
  InMemoryExercisesUnitOfWork,
  InvalidExerciseValueError,
} from './index.js';
import type { AddExerciseInput, ExerciseUseCaseDependencies } from './index.js';
import { ExerciseId, ExerciseSetId } from './domain/identifiers/exercise-identifiers.js';

class FixedClock implements Clock {
  #tick = 0;
  now(): Date {
    return new Date(Date.UTC(2026, 0, 1, 0, 0, this.#tick++));
  }
}
class SequentialUuids implements UuidService {
  #value = 1;
  generate(): Uuid {
    return `10000000-0000-4000-8000-${String(this.#value++).padStart(12, '0')}` as Uuid;
  }
  isValid(candidate: string): candidate is Uuid {
    return /^[0-9a-f-]{36}$/u.test(candidate);
  }
}
function setup(): ExerciseUseCaseDependencies & { repository: InMemoryExerciseSetRepository } {
  return {
    clock: new FixedClock(),
    repository: new InMemoryExerciseSetRepository(),
    unitOfWork: new InMemoryExercisesUnitOfWork(),
    uuidService: new SequentialUuids(),
  };
}
function input(exerciseSetId: ExerciseSetId, order = 1, type = 'Coding'): AddExerciseInput {
  return {
    difficulty: order <= 10 ? 'Basic' : order <= 20 ? 'Intermediate' : 'Advanced',
    estimatedMinutes: 5,
    expectedResult: `expected ${order}`,
    exerciseSetId,
    explanation: `Explanation for the requested exercise ${order}.`,
    language: 'typescript',
    order,
    starterCode: `const exercise${order} = true;`,
    statement: `Produce a correct answer for exercise ${order}.`,
    testCases: [{ expectedOutput: `output ${order}`, hidden: true, input: `input ${order}` }],
    title: `Application exercise ${order}`,
    type,
    validationMode: 'UnitTests',
    validationRule: `Rule ${order}`,
  };
}
async function created(dependencies: ExerciseUseCaseDependencies) {
  const result = await new CreateExerciseSet(dependencies).execute({
    lessonId: LessonId.create(dependencies.uuidService.generate()),
  });
  if (!result.isSuccess) throw result.error;
  return result.value.exerciseSetId;
}

describe('exercise application use cases', () => {
  it('creates one set per lesson and persists it', async () => {
    const dependencies = setup();
    const lessonId = LessonId.create(dependencies.uuidService.generate());
    const first = await new CreateExerciseSet(dependencies).execute({ lessonId });
    expect(first.isSuccess).toBe(true);
    expect(dependencies.repository.size).toBe(1);
    const duplicate = await new CreateExerciseSet(dependencies).execute({ lessonId });
    expect(duplicate.isSuccess).toBe(false);
    if (!duplicate.isSuccess) expect(duplicate.error).toBeInstanceOf(ExerciseSetAlreadyExistsError);
  });
  it('adds a fully described exercise and persists all generation-ready artifacts', async () => {
    const dependencies = setup();
    const id = await created(dependencies);
    const result = await new AddExercise(dependencies).execute(input(id));
    expect(result.isSuccess).toBe(true);
    const aggregate = await dependencies.repository.findById(id);
    expect(aggregate?.exercises[0]?.testCases).toHaveLength(1);
    expect(aggregate?.exercises[0]?.starterCode?.value).toContain('exercise1');
  });
  it.each([
    { field: 'type', update: { type: 'Unknown' } },
    { field: 'title', update: { title: '' } },
    { field: 'statement', update: { statement: 'short' } },
    { field: 'explanation', update: { explanation: 'short' } },
    { field: 'difficulty', update: { difficulty: 'Expert' } },
    { field: 'order', update: { order: 0 } },
    { field: 'estimatedMinutes', update: { estimatedMinutes: 0 } },
    { field: 'language', update: { language: '' } },
    { field: 'validationMode', update: { validationMode: 'Unknown' } },
    { field: 'starterCode', update: { starterCode: '' } },
    { field: 'expectedResult', update: { expectedResult: '' } },
    { field: 'validationRule', update: { validationRule: '' } },
  ])('rejects invalid $field before persistence', async ({ update }) => {
    const dependencies = setup();
    const id = await created(dependencies);
    const result = await new AddExercise(dependencies).execute({ ...input(id), ...update });
    expect(result.isSuccess).toBe(false);
  });
  it('supports absent optional generation artifacts', async () => {
    const dependencies = setup();
    const id = await created(dependencies);
    const candidate = input(id);
    const result = await new AddExercise(dependencies).execute({
      difficulty: candidate.difficulty,
      estimatedMinutes: candidate.estimatedMinutes,
      exerciseSetId: id,
      explanation: candidate.explanation,
      language: candidate.language,
      order: candidate.order,
      statement: candidate.statement,
      title: candidate.title,
      type: candidate.type,
      validationMode: 'Manual',
    });
    expect(result.isSuccess).toBe(true);
  });
  it('rejects malformed test cases, hint text and solution inputs', async () => {
    const dependencies = setup();
    const id = await created(dependencies);
    const malformedCase = await new AddExercise(dependencies).execute({
      ...input(id),
      testCases: [{ expectedOutput: 'output', hidden: false, input: '' }],
    });
    expect(malformedCase.isSuccess).toBe(false);
    const addition = await new AddExercise(dependencies).execute(input(id));
    if (!addition.isSuccess) throw addition.error;
    expect(
      (
        await new AddHint(dependencies).execute({
          exerciseId: addition.value.exerciseId,
          exerciseSetId: id,
          text: '',
        })
      ).isSuccess,
    ).toBe(false);
    expect(
      (
        await new AddSolution(dependencies).execute({
          answer: 'answer',
          exerciseId: addition.value.exerciseId,
          exerciseSetId: id,
          explanation: 'short',
        })
      ).isSuccess,
    ).toBe(false);
    expect(
      (
        await new AddSolution(dependencies).execute({
          answer: '',
          exerciseId: addition.value.exerciseId,
          exerciseSetId: id,
          explanation: 'Complete solution explanation.',
        })
      ).isSuccess,
    ).toBe(false);
  });
  it('rejects duplicate test cases', async () => {
    const dependencies = setup();
    const id = await created(dependencies);
    const candidate = input(id);
    const testCase = candidate.testCases![0]!;
    const result = await new AddExercise(dependencies).execute({
      ...candidate,
      testCases: [testCase, testCase],
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidExerciseValueError);
  });
  it('returns not found for every mutation against an unknown set', async () => {
    const dependencies = setup();
    const setId = ExerciseSetId.create(dependencies.uuidService.generate());
    const exerciseId = ExerciseId.create(dependencies.uuidService.generate());
    const results = await Promise.all([
      new AddExercise(dependencies).execute(input(setId)),
      new AddHint(dependencies).execute({ exerciseId, exerciseSetId: setId, text: 'Useful hint' }),
      new AddSolution(dependencies).execute({
        answer: 'answer',
        exerciseId,
        exerciseSetId: setId,
        explanation: 'Complete solution explanation.',
      }),
      new PublishExerciseSet(dependencies).execute({ exerciseSetId: setId }),
    ]);
    results.forEach((result) => {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(ExerciseSetNotFoundError);
    });
  });
  it('returns exercise-not-found without persisting hint or solution', async () => {
    const dependencies = setup();
    const setId = await created(dependencies);
    const exerciseId = ExerciseId.create(dependencies.uuidService.generate());
    const hint = await new AddHint(dependencies).execute({
      exerciseId,
      exerciseSetId: setId,
      text: 'Useful hint',
    });
    const solution = await new AddSolution(dependencies).execute({
      answer: 'answer',
      exerciseId,
      exerciseSetId: setId,
      explanation: 'Complete solution explanation.',
    });
    for (const result of [hint, solution]) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(ExerciseNotFoundError);
    }
  });
  it('adds hints and exactly one solution through Result-returning commands', async () => {
    const dependencies = setup();
    const setId = await created(dependencies);
    const addition = await new AddExercise(dependencies).execute(input(setId));
    if (!addition.isSuccess) throw addition.error;
    const hint = await new AddHint(dependencies).execute({
      exerciseId: addition.value.exerciseId,
      exerciseSetId: setId,
      text: 'Inspect the relevant rule.',
    });
    const solution = await new AddSolution(dependencies).execute({
      answer: 'const answer = true;',
      exerciseId: addition.value.exerciseId,
      exerciseSetId: setId,
      explanation: 'This solution applies the relevant rule.',
    });
    expect(hint.isSuccess).toBe(true);
    expect(solution.isSuccess).toBe(true);
    const duplicate = await new AddSolution(dependencies).execute({
      answer: 'another answer',
      exerciseId: addition.value.exerciseId,
      exerciseSetId: setId,
      explanation: 'Another complete explanation.',
    });
    expect(duplicate.isSuccess).toBe(false);
  });
  it('returns aggregate failures from add and publish without persistence-side exceptions', async () => {
    const dependencies = setup();
    const setId = await created(dependencies);
    const first = await new AddExercise(dependencies).execute(input(setId));
    expect(first.isSuccess).toBe(true);
    const duplicate = await new AddExercise(dependencies).execute(input(setId));
    expect(duplicate.isSuccess).toBe(false);
    const publication = await new PublishExerciseSet(dependencies).execute({
      exerciseSetId: setId,
    });
    expect(publication.isSuccess).toBe(false);
  });
  it('builds and publishes a valid 30-exercise set end to end', async () => {
    const dependencies = setup();
    const setId = await created(dependencies);
    for (let order = 1; order <= 30; order++) {
      const type = order <= 11 ? 'Coding' : order <= 20 ? 'OutputPrediction' : 'Debugging';
      const addition = await new AddExercise(dependencies).execute(input(setId, order, type));
      if (!addition.isSuccess) throw addition.error;
      await new AddHint(dependencies).execute({
        exerciseId: addition.value.exerciseId,
        exerciseSetId: setId,
        text: `Hint for ${order}`,
      });
      await new AddSolution(dependencies).execute({
        answer: `answer ${order}`,
        exerciseId: addition.value.exerciseId,
        exerciseSetId: setId,
        explanation: `Complete solution explanation for ${order}.`,
      });
    }
    const result = await new PublishExerciseSet(dependencies).execute({ exerciseSetId: setId });
    expect(result.isSuccess).toBe(true);
    expect((await dependencies.repository.findById(setId))?.status).toBe('published');
  });
  it('serializes in-memory unit-of-work operations and recovers after rejection', async () => {
    const unit = new InMemoryExercisesUnitOfWork();
    const order: number[] = [];
    const first = unit.execute(async () => {
      order.push(1);
      throw new Error('failure');
    });
    await expect(first).rejects.toThrow('failure');
    await unit.execute(async () => {
      order.push(2);
    });
    expect(order).toEqual([1, 2]);
  });
});
