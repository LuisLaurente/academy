import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidSessionValueError } from '../errors/session-errors.js';

export class SkippedCount extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<SkippedCount, InvalidSessionValueError> {
    if (!Number.isInteger(candidate) || candidate < 0) {
      return Result.failure(new InvalidSessionValueError('skipped count', candidate));
    }

    return Result.success(new SkippedCount(candidate));
  }

  static zero(): SkippedCount {
    return new SkippedCount(0);
  }

  increment(): SkippedCount {
    return new SkippedCount(this.value + 1);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
