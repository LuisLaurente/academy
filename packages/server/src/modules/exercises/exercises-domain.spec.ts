import { describe, expect, it } from 'vitest';
import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { LessonId } from '../curriculum/index.js';
import { ExerciseSet } from './domain/aggregates/exercise-set.js';
import {
  Exercise,
  ExpectedResult,
  Hint,
  Solution,
  StarterCode,
  TestCase,
  ValidationRule,
} from './domain/entities/exercise-elements.js';
import {
  DuplicateExerciseElementError,
  ExerciseSetCapacityError,
  IncompleteExerciseSetError,
  InvalidExerciseDateError,
  InvalidExerciseProgressionError,
  InvalidExerciseSetStateError,
} from './domain/errors/exercise-errors.js';
import {
  ExerciseAdded,
  ExerciseSetCreated,
  ExerciseSetPublished,
  HintAdded,
  SolutionAdded,
} from './domain/events/exercise-events.js';
import {
  ExerciseId,
  ExerciseSetId,
  HintId,
  SolutionId,
  TestCaseId,
} from './domain/identifiers/exercise-identifiers.js';
import type { Difficulty, ExerciseType } from './domain/types/exercise-types.js';
import {
  DifficultyLevel,
  EstimatedMinutes,
  ExerciseExplanation,
  ExerciseOrder,
  ExerciseStatement,
  ExerciseTitle,
  HintText,
  ProgrammingLanguage,
  SolutionExplanation,
  ValidationMode,
} from './domain/value-objects/exercise-value-objects.js';

let sequence = 1;
function uuid(): Uuid {
  return `00000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}` as Uuid;
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
function transition(offset = 0) {
  return { eventId: uuid(), occurredAt: new Date(Date.UTC(2026, 0, 1, 0, 0, offset)) };
}
function exercise(
  order: number,
  type: ExerciseType = 'Coding',
  difficulty: Difficulty = 'Basic',
): Exercise {
  return Exercise.create({
    difficulty: value(DifficultyLevel.create(difficulty)),
    estimatedMinutes: value(EstimatedMinutes.create(5)),
    expectedResult: value(ExpectedResult.create(`expected ${order}`)),
    explanation: value(ExerciseExplanation.create(`Explanation for exercise ${order}.`)),
    id: ExerciseId.create(uuid()),
    language: value(ProgrammingLanguage.create('typescript')),
    order: value(ExerciseOrder.create(order)),
    solution: undefined,
    starterCode: value(StarterCode.create(`const value${order} = 1;`)),
    statement: value(
      ExerciseStatement.create(`Write a valid solution for exercise number ${order}.`),
    ),
    testCases: [
      value(
        TestCase.create(
          TestCaseId.create(uuid()),
          `input ${order}`,
          `output ${order}`,
          order % 2 === 0,
        ),
      ),
    ],
    title: value(ExerciseTitle.create(`Exercise ${order}`)),
    type,
    validationMode: value(ValidationMode.create('UnitTests')),
    validationRule: value(
      ValidationRule.create(
        `Validate exercise ${order}`,
        value(ValidationMode.create('UnitTests')),
      ),
    ),
  });
}
function addComplete(set: ExerciseSet, item: Exercise, offset: number): void {
  const base = offset * 10;
  expect(set.addExercise(item, transition(base)).isSuccess).toBe(true);
  expect(
    set.addHint(
      item.id,
      Hint.create(HintId.create(uuid()), value(HintText.create(`Hint ${offset}`))),
      transition(base + 1),
    ).isSuccess,
  ).toBe(true);
  const solution = value(
    Solution.create(
      SolutionId.create(uuid()),
      `answer ${offset}`,
      value(SolutionExplanation.create(`Detailed solution for ${offset}.`)),
    ),
  );
  expect(set.addSolution(item.id, solution, transition(base + 2)).isSuccess).toBe(true);
}
function set(): ExerciseSet {
  return ExerciseSet.create({
    createdAt: new Date(Date.UTC(2026, 0, 1)),
    eventId: uuid(),
    id: ExerciseSetId.create(uuid()),
    lessonId: LessonId.create(uuid()),
  });
}

describe('exercise value objects and entities', () => {
  it.each([
    ['title', () => ExerciseTitle.create('  Valid title  ')],
    ['statement', () => ExerciseStatement.create('A sufficiently detailed statement.')],
    ['explanation', () => ExerciseExplanation.create('A useful explanation.')],
    ['hint', () => HintText.create('Useful hint')],
    ['solution', () => SolutionExplanation.create('Useful solution explanation.')],
  ])('creates and normalizes %s text', (_name, factory) => {
    const result = factory();
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.value).not.toMatch(/^\s|\s$/u);
  });
  it.each([
    () => ExerciseTitle.create(''),
    () => ExerciseStatement.create('short'),
    () => ExerciseExplanation.create('short'),
    () => HintText.create(''),
    () => SolutionExplanation.create('short'),
  ])('rejects invalid text', (factory) => expect(factory().isSuccess).toBe(false));
  it('compares text value semantics and canonical values', () => {
    const left = value(ExerciseTitle.create('Same Title'));
    const right = value(ExerciseTitle.create('Same Title'));
    expect(left.equals(right)).toBe(true);
    expect(left.canonicalValue).toBe('same title');
    expect(left.toString()).toBe('Same Title');
  });
  it('compares all scalar value objects by value', () => {
    expect(
      value(DifficultyLevel.create('Basic')).equals(value(DifficultyLevel.create('Basic'))),
    ).toBe(true);
    expect(value(ExerciseOrder.create(1)).equals(value(ExerciseOrder.create(1)))).toBe(true);
    expect(value(EstimatedMinutes.create(5)).equals(value(EstimatedMinutes.create(5)))).toBe(true);
    expect(
      value(ProgrammingLanguage.create('typescript')).equals(
        value(ProgrammingLanguage.create('typescript')),
      ),
    ).toBe(true);
    expect(
      value(ValidationMode.create('Manual')).equals(value(ValidationMode.create('Manual'))),
    ).toBe(true);
  });
  it.each([
    [DifficultyLevel.create('Basic'), 'Basic'],
    [ExerciseOrder.create(30), 30],
    [EstimatedMinutes.create(240), 240],
    [ProgrammingLanguage.create(' TypeScript '), 'typescript'],
    [ValidationMode.create('AST'), 'AST'],
  ])('creates constrained values', (result, expected) => {
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.value).toBe(expected);
  });
  it.each([
    DifficultyLevel.create('Expert'),
    ExerciseOrder.create(0),
    ExerciseOrder.create(31),
    EstimatedMinutes.create(0),
    EstimatedMinutes.create(241),
    ProgrammingLanguage.create(''),
    ProgrammingLanguage.create('123bad'),
    ValidationMode.create('Unknown'),
  ])('rejects constrained invalid values', (result) => expect(result.isSuccess).toBe(false));
  it('validates immutable exercise artifacts', () => {
    expect(StarterCode.create('').isSuccess).toBe(false);
    expect(ExpectedResult.create('').isSuccess).toBe(false);
    expect(ValidationRule.create('', value(ValidationMode.create('Manual'))).isSuccess).toBe(false);
    expect(TestCase.create(TestCaseId.create(uuid()), '', 'output', false).isSuccess).toBe(false);
    expect(TestCase.create(TestCaseId.create(uuid()), 'input', '', false).isSuccess).toBe(false);
    const item = exercise(1);
    expect(Object.isFrozen(item)).toBe(true);
    expect(item.testCases[0]?.hidden).toBe(false);
    const minimal = Exercise.create({
      difficulty: item.difficulty,
      estimatedMinutes: item.estimatedMinutes,
      expectedResult: undefined,
      explanation: item.explanation,
      id: item.id,
      language: item.language,
      order: item.order,
      solution: undefined,
      starterCode: undefined,
      statement: item.statement,
      title: item.title,
      type: item.type,
      validationMode: item.validationMode,
      validationRule: undefined,
    });
    expect(minimal.hints).toEqual([]);
    expect(minimal.testCases).toEqual([]);
  });
  it('preserves entity identity while producing immutable enriched copies', () => {
    const item = exercise(1);
    const hint = Hint.create(HintId.create(uuid()), value(HintText.create('A hint')));
    const enriched = item.withHint(hint);
    expect(enriched.equals(item)).toBe(true);
    expect(item.hints).toHaveLength(0);
    expect(enriched.hints).toHaveLength(1);
  });
});

describe('ExerciseSet aggregate', () => {
  it('creates a draft and records an immutable creation event', () => {
    const aggregate = set();
    expect(aggregate.status).toBe('draft');
    expect(aggregate.exercises).toHaveLength(0);
    expect(aggregate.pendingDomainEvents[0]).toBeInstanceOf(ExerciseSetCreated);
    expect(Object.isFrozen(aggregate.pendingDomainEvents)).toBe(true);
  });
  it('adds exercises, hints and one solution while recording events', () => {
    const aggregate = set();
    const item = exercise(1);
    addComplete(aggregate, item, 1);
    expect(aggregate.pendingDomainEvents.some((event) => event instanceof ExerciseAdded)).toBe(
      true,
    );
    expect(aggregate.pendingDomainEvents.some((event) => event instanceof HintAdded)).toBe(true);
    expect(aggregate.pendingDomainEvents.some((event) => event instanceof SolutionAdded)).toBe(
      true,
    );
    expect(aggregate.exercises[0]?.hints).toHaveLength(1);
    expect(aggregate.exercises[0]?.solution).toBeDefined();
  });
  it('rejects duplicate ids, titles, statements and nonconsecutive order', () => {
    const aggregate = set();
    const first = exercise(1);
    expect(aggregate.addExercise(first, transition(1)).isSuccess).toBe(true);
    expect(failure(aggregate.addExercise(first, transition(2)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    const titleDuplicate = Exercise.create({ ...exercise(2), title: first.title });
    expect(failure(aggregate.addExercise(titleDuplicate, transition(2)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    const statementDuplicate = Exercise.create({ ...exercise(2), statement: first.statement });
    expect(failure(aggregate.addExercise(statementDuplicate, transition(2)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    expect(failure(aggregate.addExercise(exercise(3), transition(3)))).toBeInstanceOf(
      InvalidExerciseProgressionError,
    );
  });
  it('rejects difficulty regressions and a fifth multiple-choice exercise', () => {
    const aggregate = set();
    expect(aggregate.addExercise(exercise(1, 'Coding', 'Advanced'), transition(1)).isSuccess).toBe(
      true,
    );
    expect(
      failure(aggregate.addExercise(exercise(2, 'Coding', 'Basic'), transition(2))),
    ).toBeInstanceOf(InvalidExerciseProgressionError);
    const choices = set();
    for (let order = 1; order <= 4; order++)
      expect(
        choices.addExercise(exercise(order, 'MultipleChoice'), transition(order)).isSuccess,
      ).toBe(true);
    expect(
      failure(choices.addExercise(exercise(5, 'MultipleChoice'), transition(5))),
    ).toBeInstanceOf(InvalidExerciseProgressionError);
  });
  it('rejects duplicate hints and solutions and unknown exercises', () => {
    const aggregate = set();
    const item = exercise(1);
    aggregate.addExercise(item, transition(1));
    const hint = Hint.create(HintId.create(uuid()), value(HintText.create('Unique hint')));
    aggregate.addHint(item.id, hint, transition(2));
    expect(failure(aggregate.addHint(item.id, hint, transition(3)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    const sameText = Hint.create(HintId.create(uuid()), hint.text);
    expect(failure(aggregate.addHint(item.id, sameText, transition(3)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    const solution = value(
      Solution.create(
        SolutionId.create(uuid()),
        'answer',
        value(SolutionExplanation.create('A complete solution explanation.')),
      ),
    );
    aggregate.addSolution(item.id, solution, transition(4));
    expect(failure(aggregate.addSolution(item.id, solution, transition(5)))).toBeInstanceOf(
      DuplicateExerciseElementError,
    );
    expect(aggregate.addHint(ExerciseId.create(uuid()), hint, transition(5)).isSuccess).toBe(false);
    expect(
      aggregate.addSolution(ExerciseId.create(uuid()), solution, transition(5)).isSuccess,
    ).toBe(false);
  });
  it('does not publish incomplete sets', () =>
    expect(failure(set().publish(transition()))).toBeInstanceOf(IncompleteExerciseSetError));
  it('publishes exactly 30 complete exercises with coding as strict plurality', () => {
    const aggregate = set();
    for (let order = 1; order <= 30; order++)
      addComplete(
        aggregate,
        exercise(order, order <= 11 ? 'Coding' : order <= 20 ? 'OutputPrediction' : 'Debugging'),
        order,
      );
    const result = aggregate.publish(transition(999));
    expect(result.isSuccess).toBe(true);
    expect(aggregate.status).toBe('published');
    expect(aggregate.pendingDomainEvents.at(-1)).toBeInstanceOf(ExerciseSetPublished);
    expect(failure(aggregate.addExercise(exercise(30), transition(1000)))).toBeInstanceOf(
      InvalidExerciseSetStateError,
    );
    expect(
      failure(
        aggregate.addHint(
          aggregate.exercises[0]!.id,
          Hint.create(HintId.create(uuid()), value(HintText.create('Later hint'))),
          transition(1000),
        ),
      ),
    ).toBeInstanceOf(InvalidExerciseSetStateError);
  });
  it('rejects publication when coding is not predominant', () => {
    const aggregate = set();
    for (let order = 1; order <= 30; order++)
      addComplete(
        aggregate,
        exercise(order, order <= 10 ? 'Coding' : order <= 20 ? 'OutputPrediction' : 'Debugging'),
        order,
      );
    expect(failure(aggregate.publish(transition(999)))).toBeInstanceOf(IncompleteExerciseSetError);
  });
  it('reports missing hints and then missing solutions on complete drafts', () => {
    const aggregate = set();
    for (let order = 1; order <= 30; order++)
      aggregate.addExercise(exercise(order), transition(order));
    expect(failure(aggregate.publish(transition(100)))).toMatchObject({
      context: { reason: 'missing-hint' },
    });
    for (const [index, item] of aggregate.exercises.entries()) {
      aggregate.addHint(
        item.id,
        Hint.create(HintId.create(uuid()), value(HintText.create(`Hint complete ${index}`))),
        transition(101 + index),
      );
    }
    expect(failure(aggregate.publish(transition(200)))).toMatchObject({
      context: { reason: 'missing-solution' },
    });
  });
  it('enforces capacity and temporal invariants', () => {
    const aggregate = set();
    for (let order = 1; order <= 30; order++)
      aggregate.addExercise(exercise(order), transition(order));
    expect(failure(aggregate.addExercise(exercise(30), transition(31)))).toBeInstanceOf(
      ExerciseSetCapacityError,
    );
    expect(() =>
      aggregate.addHint(
        aggregate.exercises[0]!.id,
        Hint.create(HintId.create(uuid()), value(HintText.create('Past hint'))),
        transition(-1),
      ),
    ).toThrow(InvalidExerciseDateError);
  });
  it('validates rehydrated state', () => {
    const aggregate = set();
    const base = {
      aggregateVersion: 1,
      createdAt: aggregate.createdAt,
      exercises: [],
      id: aggregate.id,
      lessonId: aggregate.lessonId,
      status: 'draft' as const,
      updatedAt: aggregate.updatedAt,
    };
    expect(() => ExerciseSet.rehydrate({ ...base, aggregateVersion: 0 })).toThrow(
      InvalidExerciseProgressionError,
    );
    expect(() => ExerciseSet.rehydrate({ ...base, status: 'broken' as 'draft' })).toThrow(
      InvalidExerciseSetStateError,
    );
    expect(() => ExerciseSet.rehydrate({ ...base, createdAt: new Date('invalid') })).toThrow(
      InvalidExerciseDateError,
    );
    expect(() => ExerciseSet.rehydrate({ ...base, updatedAt: new Date(0) })).toThrow(
      InvalidExerciseDateError,
    );
    expect(() => ExerciseSet.rehydrate({ ...base, exercises: [exercise(2)] })).toThrow(
      InvalidExerciseProgressionError,
    );
    const duplicated = exercise(1);
    expect(() =>
      ExerciseSet.rehydrate({
        ...base,
        exercises: [duplicated, Exercise.create({ ...exercise(2), id: duplicated.id })],
      }),
    ).toThrow(DuplicateExerciseElementError);
    expect(() =>
      ExerciseSet.rehydrate({
        ...base,
        exercises: [exercise(1, 'Coding', 'Advanced'), exercise(2, 'Coding', 'Basic')],
      }),
    ).toThrow(InvalidExerciseProgressionError);
    expect(() =>
      ExerciseSet.rehydrate({
        ...base,
        exercises: Array.from({ length: 31 }, (_item, index) => exercise(Math.min(index + 1, 30))),
      }),
    ).toThrow(ExerciseSetCapacityError);
    expect(() => ExerciseSet.rehydrate({ ...base, status: 'published' })).toThrow(
      IncompleteExerciseSetError,
    );
  });
});
