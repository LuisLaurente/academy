import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidSessionValueError } from '../errors/session-errors.js';

export class CompletedCount extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<CompletedCount, InvalidSessionValueError> {
    if (!Number.isInteger(candidate) || candidate < 0) {
      return Result.failure(new InvalidSessionValueError('completed count', candidate));
    }

    return Result.success(new CompletedCount(candidate));
  }

  static zero(): CompletedCount {
    return new CompletedCount(0);
  }

  increment(): CompletedCount {
    return new CompletedCount(this.value + 1);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
