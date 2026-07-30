import type { UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Clock } from '../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import { ExerciseSet, type ExerciseTransition } from '../../domain/aggregates/exercise-set.js';
import {
  Exercise,
  ExpectedResult,
  Hint,
  Solution,
  StarterCode,
  TestCase,
  ValidationRule,
} from '../../domain/entities/exercise-elements.js';
import {
  ExerciseSetAlreadyExistsError,
  ExerciseSetNotFoundError,
  InvalidExerciseValueError,
  type ExerciseError,
} from '../../domain/errors/exercise-errors.js';
import {
  ExerciseId,
  ExerciseSetId,
  HintId,
  SolutionId,
  TestCaseId,
} from '../../domain/identifiers/exercise-identifiers.js';
import { EXERCISE_TYPES, type ExerciseType } from '../../domain/types/exercise-types.js';
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
} from '../../domain/value-objects/exercise-value-objects.js';
import type {
  AddExerciseInput,
  AddExerciseOutput,
  AddHintInput,
  AddHintOutput,
  AddSolutionInput,
  AddSolutionOutput,
  CreateExerciseSetInput,
  CreateExerciseSetOutput,
  ExerciseSetVersionOutput,
  PublishExerciseSetInput,
  TestCaseInput,
} from '../dtos/exercise-commands.js';
import type { ExerciseSetRepository } from '../ports/exercise-set-repository.js';

export interface ExerciseUseCaseDependencies {
  readonly clock: Clock;
  readonly repository: ExerciseSetRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}
type ExerciseUseCaseResult<T> = Promise<ResultType<T, ExerciseError>>;

export class CreateExerciseSet {
  constructor(private readonly dependencies: ExerciseUseCaseDependencies) {}
  execute(input: CreateExerciseSetInput): ExerciseUseCaseResult<CreateExerciseSetOutput> {
    return this.dependencies.unitOfWork.execute(async () => {
      if (await this.dependencies.repository.findByLessonId(input.lessonId))
        return Result.failure(new ExerciseSetAlreadyExistsError());
      const now = this.dependencies.clock.now();
      const set = ExerciseSet.create({
        createdAt: now,
        eventId: this.dependencies.uuidService.generate(),
        id: ExerciseSetId.create(this.dependencies.uuidService.generate()),
        lessonId: input.lessonId,
      });
      await this.dependencies.repository.save(set);
      return Result.success(
        Object.freeze({ exerciseSetId: set.id, version: set.aggregateVersion }),
      );
    });
  }
}

export class AddExercise {
  constructor(private readonly dependencies: ExerciseUseCaseDependencies) {}
  async execute(input: AddExerciseInput): ExerciseUseCaseResult<AddExerciseOutput> {
    const prepared = prepareExercise(input, this.dependencies.uuidService);
    if (!prepared.isSuccess) return prepared;
    return this.dependencies.unitOfWork.execute(async () => {
      const set = await this.dependencies.repository.findById(input.exerciseSetId);
      if (!set) return Result.failure(new ExerciseSetNotFoundError());
      const added = set.addExercise(prepared.value, transition(this.dependencies));
      if (!added.isSuccess) return added;
      await this.dependencies.repository.save(set);
      return Result.success(
        Object.freeze({ exerciseId: prepared.value.id, version: set.aggregateVersion }),
      );
    });
  }
}

export class AddHint {
  constructor(private readonly dependencies: ExerciseUseCaseDependencies) {}
  async execute(input: AddHintInput): ExerciseUseCaseResult<AddHintOutput> {
    const text = HintText.create(input.text);
    if (!text.isSuccess) return text;
    const hint = Hint.create(HintId.create(this.dependencies.uuidService.generate()), text.value);
    return this.dependencies.unitOfWork.execute(async () => {
      const set = await this.dependencies.repository.findById(input.exerciseSetId);
      if (!set) return Result.failure(new ExerciseSetNotFoundError());
      const added = set.addHint(input.exerciseId, hint, transition(this.dependencies));
      if (!added.isSuccess) return added;
      await this.dependencies.repository.save(set);
      return Result.success(Object.freeze({ hintId: hint.id, version: set.aggregateVersion }));
    });
  }
}

export class AddSolution {
  constructor(private readonly dependencies: ExerciseUseCaseDependencies) {}
  async execute(input: AddSolutionInput): ExerciseUseCaseResult<AddSolutionOutput> {
    const explanation = SolutionExplanation.create(input.explanation);
    if (!explanation.isSuccess) return explanation;
    const solution = Solution.create(
      SolutionId.create(this.dependencies.uuidService.generate()),
      input.answer,
      explanation.value,
    );
    if (!solution.isSuccess) return solution;
    return this.dependencies.unitOfWork.execute(async () => {
      const set = await this.dependencies.repository.findById(input.exerciseSetId);
      if (!set) return Result.failure(new ExerciseSetNotFoundError());
      const added = set.addSolution(
        input.exerciseId,
        solution.value,
        transition(this.dependencies),
      );
      if (!added.isSuccess) return added;
      await this.dependencies.repository.save(set);
      return Result.success(
        Object.freeze({ solutionId: solution.value.id, version: set.aggregateVersion }),
      );
    });
  }
}

export class PublishExerciseSet {
  constructor(private readonly dependencies: ExerciseUseCaseDependencies) {}
  execute(input: PublishExerciseSetInput): ExerciseUseCaseResult<ExerciseSetVersionOutput> {
    return mutate(this.dependencies, input.exerciseSetId, (set) =>
      set.publish(transition(this.dependencies)),
    );
  }
}

async function mutate(
  dependencies: ExerciseUseCaseDependencies,
  id: ExerciseSetId,
  mutation: (set: ExerciseSet) => ResultType<void, ExerciseError>,
): ExerciseUseCaseResult<ExerciseSetVersionOutput> {
  return dependencies.unitOfWork.execute(async () => {
    const set = await dependencies.repository.findById(id);
    if (!set) return Result.failure(new ExerciseSetNotFoundError());
    const result = mutation(set);
    if (!result.isSuccess) return result;
    await dependencies.repository.save(set);
    return Result.success(Object.freeze({ version: set.aggregateVersion }));
  });
}

function prepareExercise(
  input: AddExerciseInput,
  uuids: UuidService,
): ResultType<Exercise, ExerciseError> {
  const title = ExerciseTitle.create(input.title);
  if (!title.isSuccess) return title;
  const statement = ExerciseStatement.create(input.statement);
  if (!statement.isSuccess) return statement;
  const explanation = ExerciseExplanation.create(input.explanation);
  if (!explanation.isSuccess) return explanation;
  const difficulty = DifficultyLevel.create(input.difficulty);
  if (!difficulty.isSuccess) return difficulty;
  const order = ExerciseOrder.create(input.order);
  if (!order.isSuccess) return order;
  const estimatedMinutes = EstimatedMinutes.create(input.estimatedMinutes);
  if (!estimatedMinutes.isSuccess) return estimatedMinutes;
  const language = ProgrammingLanguage.create(input.language);
  if (!language.isSuccess) return language;
  const validationMode = ValidationMode.create(input.validationMode);
  if (!validationMode.isSuccess) return validationMode;
  if (!EXERCISE_TYPES.includes(input.type as ExerciseType))
    return Result.failure(new InvalidExerciseValueError('type'));
  const starterCode = optional(input.starterCode, StarterCode.create);
  if (!starterCode.isSuccess) return starterCode;
  const expectedResult = optional(input.expectedResult, ExpectedResult.create);
  if (!expectedResult.isSuccess) return expectedResult;
  const validationRule =
    input.validationRule === undefined
      ? Result.success(undefined)
      : ValidationRule.create(input.validationRule, validationMode.value);
  if (!validationRule.isSuccess) return validationRule;
  const testCases = prepareTestCases(input.testCases ?? [], uuids);
  if (!testCases.isSuccess) return testCases;
  return Result.success(
    Exercise.create({
      difficulty: difficulty.value,
      estimatedMinutes: estimatedMinutes.value,
      expectedResult: expectedResult.value,
      explanation: explanation.value,
      id: ExerciseId.create(uuids.generate()),
      language: language.value,
      order: order.value,
      solution: undefined,
      starterCode: starterCode.value,
      statement: statement.value,
      testCases: testCases.value,
      title: title.value,
      type: input.type as ExerciseType,
      validationMode: validationMode.value,
      validationRule: validationRule.value,
    }),
  );
}
function optional<T>(
  value: string | undefined,
  factory: (value: string) => ResultType<T, InvalidExerciseValueError>,
): ResultType<T | undefined, InvalidExerciseValueError> {
  return value === undefined ? Result.success(undefined) : factory(value);
}
function prepareTestCases(
  inputs: readonly TestCaseInput[],
  uuids: UuidService,
): ResultType<readonly TestCase[], ExerciseError> {
  const cases: TestCase[] = [];
  for (const input of inputs) {
    const testCase = TestCase.create(
      TestCaseId.create(uuids.generate()),
      input.input,
      input.expectedOutput,
      input.hidden,
    );
    if (!testCase.isSuccess) return testCase;
    if (
      cases.some(
        (item) =>
          item.input === testCase.value.input &&
          item.expectedOutput === testCase.value.expectedOutput,
      )
    )
      return Result.failure(new InvalidExerciseValueError('duplicateTestCase'));
    cases.push(testCase.value);
  }
  return Result.success(Object.freeze(cases));
}
function transition(dependencies: ExerciseUseCaseDependencies): ExerciseTransition {
  return { eventId: dependencies.uuidService.generate(), occurredAt: dependencies.clock.now() };
}
