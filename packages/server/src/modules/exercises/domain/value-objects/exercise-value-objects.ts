import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidExerciseTextError, InvalidExerciseValueError } from '../errors/exercise-errors.js';
import {
  DIFFICULTIES,
  VALIDATION_MODES,
  type Difficulty,
  type ValidationModeValue,
} from '../types/exercise-types.js';

const TEXT_LIMITS = Object.freeze({
  explanation: [10, 6_000],
  hint: [3, 2_000],
  solutionExplanation: [10, 6_000],
  statement: [10, 10_000],
  title: [3, 180],
} as const);

abstract class ExerciseText extends ValueObject {
  readonly value: string;
  protected constructor(value: string) {
    super();
    this.value = value;
  }
  get canonicalValue(): string {
    return this.value.normalize('NFKC').toLowerCase();
  }
  override toString(): string {
    return this.value;
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}

function text<T extends ExerciseText>(
  candidate: string,
  field: keyof typeof TEXT_LIMITS,
  factory: (value: string) => T,
): ResultType<T, InvalidExerciseTextError> {
  const [minimum, maximum] = TEXT_LIMITS[field];
  const value = candidate.replace(/\r\n?/gu, '\n').trim();
  return value.length < minimum || value.length > maximum
    ? Result.failure(new InvalidExerciseTextError(field, minimum, maximum))
    : Result.success(factory(value));
}

export class ExerciseTitle extends ExerciseText {
  static create(value: string): ResultType<ExerciseTitle, InvalidExerciseTextError> {
    return text(value, 'title', (prepared) => new ExerciseTitle(prepared));
  }
}
export class ExerciseStatement extends ExerciseText {
  static create(value: string): ResultType<ExerciseStatement, InvalidExerciseTextError> {
    return text(value, 'statement', (prepared) => new ExerciseStatement(prepared));
  }
}
export class ExerciseExplanation extends ExerciseText {
  static create(value: string): ResultType<ExerciseExplanation, InvalidExerciseTextError> {
    return text(value, 'explanation', (prepared) => new ExerciseExplanation(prepared));
  }
}
export class HintText extends ExerciseText {
  static create(value: string): ResultType<HintText, InvalidExerciseTextError> {
    return text(value, 'hint', (prepared) => new HintText(prepared));
  }
}
export class SolutionExplanation extends ExerciseText {
  static create(value: string): ResultType<SolutionExplanation, InvalidExerciseTextError> {
    return text(value, 'solutionExplanation', (prepared) => new SolutionExplanation(prepared));
  }
}

export class DifficultyLevel extends ValueObject {
  private constructor(readonly value: Difficulty) {
    super();
  }
  static create(value: string): ResultType<DifficultyLevel, InvalidExerciseValueError> {
    return DIFFICULTIES.includes(value as Difficulty)
      ? Result.success(new DifficultyLevel(value as Difficulty))
      : Result.failure(new InvalidExerciseValueError('difficulty'));
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}
export class ExerciseOrder extends ValueObject {
  private constructor(readonly value: number) {
    super();
  }
  static create(value: number): ResultType<ExerciseOrder, InvalidExerciseValueError> {
    return Number.isSafeInteger(value) && value >= 1 && value <= 30
      ? Result.success(new ExerciseOrder(value))
      : Result.failure(new InvalidExerciseValueError('order'));
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
export class EstimatedMinutes extends ValueObject {
  private constructor(readonly value: number) {
    super();
  }
  static create(value: number): ResultType<EstimatedMinutes, InvalidExerciseValueError> {
    return Number.isSafeInteger(value) && value >= 1 && value <= 240
      ? Result.success(new EstimatedMinutes(value))
      : Result.failure(new InvalidExerciseValueError('estimatedMinutes'));
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
export class ProgrammingLanguage extends ValueObject {
  private constructor(readonly value: string) {
    super();
  }
  static create(value: string): ResultType<ProgrammingLanguage, InvalidExerciseValueError> {
    const prepared = value.trim().toLowerCase();
    return /^[a-z][a-z0-9+#.-]{0,39}$/u.test(prepared)
      ? Result.success(new ProgrammingLanguage(prepared))
      : Result.failure(new InvalidExerciseValueError('programmingLanguage'));
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}
export class ValidationMode extends ValueObject {
  private constructor(readonly value: ValidationModeValue) {
    super();
  }
  static create(value: string): ResultType<ValidationMode, InvalidExerciseValueError> {
    return VALIDATION_MODES.includes(value as ValidationModeValue)
      ? Result.success(new ValidationMode(value as ValidationModeValue))
      : Result.failure(new InvalidExerciseValueError('validationMode'));
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}
