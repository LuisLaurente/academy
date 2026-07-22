import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import {
  InvalidCurriculumTextError,
  InvalidDifficultyLevelError,
  InvalidLearningOrderError,
} from '../errors/curriculum-errors.js';

const TOPIC_NAME_MINIMUM_LENGTH = 2;
const TOPIC_NAME_MAXIMUM_LENGTH = 120;
const TOPIC_DESCRIPTION_MINIMUM_LENGTH = 10;
const TOPIC_DESCRIPTION_MAXIMUM_LENGTH = 2_000;
const LESSON_TITLE_MINIMUM_LENGTH = 2;
const LESSON_TITLE_MAXIMUM_LENGTH = 160;
const CONCEPT_NAME_MINIMUM_LENGTH = 2;
const CONCEPT_NAME_MAXIMUM_LENGTH = 120;

abstract class CurriculumTextValueObject extends ValueObject {
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

export class TopicName extends CurriculumTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<TopicName, InvalidCurriculumTextError> {
    const validation = validateText(
      candidate,
      'topicName',
      TOPIC_NAME_MINIMUM_LENGTH,
      TOPIC_NAME_MAXIMUM_LENGTH,
    );
    return validation.isSuccess ? Result.success(new TopicName(validation.value)) : validation;
  }
}

export class TopicDescription extends CurriculumTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<TopicDescription, InvalidCurriculumTextError> {
    const validation = validateText(
      candidate,
      'topicDescription',
      TOPIC_DESCRIPTION_MINIMUM_LENGTH,
      TOPIC_DESCRIPTION_MAXIMUM_LENGTH,
    );
    return validation.isSuccess
      ? Result.success(new TopicDescription(validation.value))
      : validation;
  }
}

export class LessonTitle extends CurriculumTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<LessonTitle, InvalidCurriculumTextError> {
    const validation = validateText(
      candidate,
      'lessonTitle',
      LESSON_TITLE_MINIMUM_LENGTH,
      LESSON_TITLE_MAXIMUM_LENGTH,
    );
    return validation.isSuccess ? Result.success(new LessonTitle(validation.value)) : validation;
  }
}

export class ConceptName extends CurriculumTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<ConceptName, InvalidCurriculumTextError> {
    const validation = validateText(
      candidate,
      'conceptName',
      CONCEPT_NAME_MINIMUM_LENGTH,
      CONCEPT_NAME_MAXIMUM_LENGTH,
    );
    return validation.isSuccess ? Result.success(new ConceptName(validation.value)) : validation;
  }
}

export class LearningOrder extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<LearningOrder, InvalidLearningOrderError> {
    return Number.isSafeInteger(candidate) && candidate > 0
      ? Result.success(new LearningOrder(candidate))
      : Result.failure(new InvalidLearningOrderError());
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}

export type DifficultyLevelValue = 1 | 2 | 3 | 4 | 5;

export class DifficultyLevel extends ValueObject {
  readonly value: DifficultyLevelValue;

  private constructor(value: DifficultyLevelValue) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<DifficultyLevel, InvalidDifficultyLevelError> {
    return isDifficultyLevel(candidate)
      ? Result.success(new DifficultyLevel(candidate))
      : Result.failure(new InvalidDifficultyLevelError());
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}

export function normalizeCurriculumLabel(candidate: string): string {
  return candidate.trim().replace(/\s+/gu, ' ');
}

export function canonicalizeCurriculumLabel(candidate: string): string {
  return normalizeCurriculumLabel(candidate).normalize('NFKC').toLowerCase();
}

function validateText(
  candidate: string,
  field: string,
  minimumLength: number,
  maximumLength: number,
): ResultType<string, InvalidCurriculumTextError> {
  const normalized = normalizeCurriculumLabel(candidate);
  return normalized.length >= minimumLength && normalized.length <= maximumLength
    ? Result.success(normalized)
    : Result.failure(new InvalidCurriculumTextError(field, minimumLength, maximumLength));
}

function isDifficultyLevel(candidate: number): candidate is DifficultyLevelValue {
  return Number.isInteger(candidate) && candidate >= 1 && candidate <= 5;
}
