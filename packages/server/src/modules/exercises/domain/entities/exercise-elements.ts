import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { Entity } from '../../../../domain/entities/entity.js';
import { InvalidExerciseValueError } from '../errors/exercise-errors.js';
import type {
  ExerciseId,
  HintId,
  SolutionId,
  TestCaseId,
} from '../identifiers/exercise-identifiers.js';
import type { ExerciseType } from '../types/exercise-types.js';
import type {
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
} from '../value-objects/exercise-value-objects.js';

function artifact(
  value: string,
  field: string,
  maximum: number,
): ResultType<string, InvalidExerciseValueError> {
  const prepared = value.replace(/\r\n?/gu, '\n').trim();
  return prepared.length === 0 || prepared.length > maximum
    ? Result.failure(new InvalidExerciseValueError(field))
    : Result.success(prepared);
}

export class StarterCode {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }
  static create(value: string): ResultType<StarterCode, InvalidExerciseValueError> {
    const prepared = artifact(value, 'starterCode', 20_000);
    return prepared.isSuccess ? Result.success(new StarterCode(prepared.value)) : prepared;
  }
}
export class ExpectedResult {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }
  static create(value: string): ResultType<ExpectedResult, InvalidExerciseValueError> {
    const prepared = artifact(value, 'expectedResult', 10_000);
    return prepared.isSuccess ? Result.success(new ExpectedResult(prepared.value)) : prepared;
  }
}
export class ValidationRule {
  private constructor(
    readonly description: string,
    readonly mode: ValidationMode,
  ) {
    Object.freeze(this);
  }
  static create(
    description: string,
    mode: ValidationMode,
  ): ResultType<ValidationRule, InvalidExerciseValueError> {
    const prepared = artifact(description, 'validationRule', 5_000);
    return prepared.isSuccess ? Result.success(new ValidationRule(prepared.value, mode)) : prepared;
  }
}

export class Hint extends Entity<HintId> {
  private constructor(
    id: HintId,
    readonly text: HintText,
  ) {
    super(id);
    Object.freeze(this);
  }
  static create(id: HintId, text: HintText): Hint {
    return new Hint(id, text);
  }
}
export class Solution extends Entity<SolutionId> {
  private constructor(
    id: SolutionId,
    readonly answer: string,
    readonly explanation: SolutionExplanation,
  ) {
    super(id);
    this.answer = answer;
    this.explanation = explanation;
    Object.freeze(this);
  }
  static create(
    id: SolutionId,
    answer: string,
    explanation: SolutionExplanation,
  ): ResultType<Solution, InvalidExerciseValueError> {
    const prepared = artifact(answer, 'solution', 20_000);
    return prepared.isSuccess
      ? Result.success(new Solution(id, prepared.value, explanation))
      : prepared;
  }
}
export class TestCase extends Entity<TestCaseId> {
  private constructor(
    id: TestCaseId,
    readonly input: string,
    readonly expectedOutput: string,
    readonly hidden: boolean,
  ) {
    super(id);
    this.input = input;
    this.expectedOutput = expectedOutput;
    this.hidden = hidden;
    Object.freeze(this);
  }
  static create(
    id: TestCaseId,
    input: string,
    expectedOutput: string,
    hidden: boolean,
  ): ResultType<TestCase, InvalidExerciseValueError> {
    const preparedInput = artifact(input, 'testCaseInput', 10_000);
    if (!preparedInput.isSuccess) return preparedInput;
    const preparedOutput = artifact(expectedOutput, 'testCaseExpectedOutput', 10_000);
    return preparedOutput.isSuccess
      ? Result.success(new TestCase(id, preparedInput.value, preparedOutput.value, hidden))
      : preparedOutput;
  }
}

export interface ExerciseState {
  readonly difficulty: DifficultyLevel;
  readonly estimatedMinutes: EstimatedMinutes;
  readonly expectedResult: ExpectedResult | undefined;
  readonly explanation: ExerciseExplanation;
  readonly hints?: readonly Hint[];
  readonly id: ExerciseId;
  readonly language: ProgrammingLanguage;
  readonly order: ExerciseOrder;
  readonly solution: Solution | undefined;
  readonly starterCode: StarterCode | undefined;
  readonly statement: ExerciseStatement;
  readonly testCases?: readonly TestCase[];
  readonly title: ExerciseTitle;
  readonly type: ExerciseType;
  readonly validationMode: ValidationMode;
  readonly validationRule: ValidationRule | undefined;
}

export class Exercise extends Entity<ExerciseId> {
  readonly difficulty: DifficultyLevel;
  readonly estimatedMinutes: EstimatedMinutes;
  readonly expectedResult: ExpectedResult | undefined;
  readonly explanation: ExerciseExplanation;
  readonly hints: readonly Hint[];
  readonly language: ProgrammingLanguage;
  readonly order: ExerciseOrder;
  readonly solution: Solution | undefined;
  readonly starterCode: StarterCode | undefined;
  readonly statement: ExerciseStatement;
  readonly testCases: readonly TestCase[];
  readonly title: ExerciseTitle;
  readonly type: ExerciseType;
  readonly validationMode: ValidationMode;
  readonly validationRule: ValidationRule | undefined;

  private constructor(state: ExerciseState) {
    super(state.id);
    this.difficulty = state.difficulty;
    this.estimatedMinutes = state.estimatedMinutes;
    this.expectedResult = state.expectedResult;
    this.explanation = state.explanation;
    this.hints = Object.freeze([...(state.hints ?? [])]);
    this.language = state.language;
    this.order = state.order;
    this.solution = state.solution;
    this.starterCode = state.starterCode;
    this.statement = state.statement;
    this.testCases = Object.freeze([...(state.testCases ?? [])]);
    this.title = state.title;
    this.type = state.type;
    this.validationMode = state.validationMode;
    this.validationRule = state.validationRule;
    Object.freeze(this);
  }
  static create(state: ExerciseState): Exercise {
    return new Exercise(state);
  }
  withHint(hint: Hint): Exercise {
    return new Exercise({ ...this.snapshot(), hints: [...this.hints, hint] });
  }
  withSolution(solution: Solution): Exercise {
    return new Exercise({ ...this.snapshot(), solution });
  }
  private snapshot(): ExerciseState {
    return {
      difficulty: this.difficulty,
      estimatedMinutes: this.estimatedMinutes,
      expectedResult: this.expectedResult,
      explanation: this.explanation,
      hints: this.hints,
      id: this.id,
      language: this.language,
      order: this.order,
      solution: this.solution,
      starterCode: this.starterCode,
      statement: this.statement,
      testCases: this.testCases,
      title: this.title,
      type: this.type,
      validationMode: this.validationMode,
      validationRule: this.validationRule,
    };
  }
}
