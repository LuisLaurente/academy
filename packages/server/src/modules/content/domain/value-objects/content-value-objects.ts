import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidContentTextError, InvalidDisplayOrderError } from '../errors/content-errors.js';

const LIMITS = Object.freeze({
  commonMistake: [3, 1_000],
  connection: [5, 2_000],
  exampleCode: [1, 20_000],
  exampleExplanation: [10, 4_000],
  exampleTitle: [2, 160],
  keyConcept: [2, 120],
  summary: [10, 4_000],
  theory: [20, 20_000],
} as const);

abstract class ContentTextValueObject extends ValueObject {
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

function createText<TValue extends ContentTextValueObject>(
  candidate: string,
  field: keyof typeof LIMITS,
  factory: (value: string) => TValue,
  compact = false,
): ResultType<TValue, InvalidContentTextError> {
  const [minimumLength, maximumLength] = LIMITS[field];
  const prepared = candidate.replace(/\r\n?/gu, '\n').trim();
  const normalized = compact ? prepared.replace(/\s+/gu, ' ') : prepared;
  return normalized.length >= minimumLength && normalized.length <= maximumLength
    ? Result.success(factory(normalized))
    : Result.failure(new InvalidContentTextError(field, minimumLength, maximumLength));
}

export class TheoryText extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<TheoryText, InvalidContentTextError> {
    return createText(value, 'theory', (item) => new TheoryText(item));
  }
}
export class SummaryText extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<SummaryText, InvalidContentTextError> {
    return createText(value, 'summary', (item) => new SummaryText(item));
  }
}
export class ConnectionText extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<ConnectionText, InvalidContentTextError> {
    return createText(value, 'connection', (item) => new ConnectionText(item));
  }
}
export class CommonMistakeText extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<CommonMistakeText, InvalidContentTextError> {
    return createText(value, 'commonMistake', (item) => new CommonMistakeText(item));
  }
}
export class ExampleTitle extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<ExampleTitle, InvalidContentTextError> {
    return createText(value, 'exampleTitle', (item) => new ExampleTitle(item), true);
  }
}
export class ExampleExplanation extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<ExampleExplanation, InvalidContentTextError> {
    return createText(value, 'exampleExplanation', (item) => new ExampleExplanation(item));
  }
}
export class ExampleCode extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<ExampleCode, InvalidContentTextError> {
    return createText(value, 'exampleCode', (item) => new ExampleCode(item));
  }
}
export class KeyConceptName extends ContentTextValueObject {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(value: string): ResultType<KeyConceptName, InvalidContentTextError> {
    return createText(value, 'keyConcept', (item) => new KeyConceptName(item), true);
  }
}

export class DisplayOrder extends ValueObject {
  readonly value: number;
  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }
  static create(value: number): ResultType<DisplayOrder, InvalidDisplayOrderError> {
    return Number.isSafeInteger(value) && value > 0
      ? Result.success(new DisplayOrder(value))
      : Result.failure(new InvalidDisplayOrderError());
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
