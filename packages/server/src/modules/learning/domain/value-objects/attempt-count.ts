import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidAttemptCountError } from '../errors/learning-errors.js';

export class AttemptCount extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<AttemptCount, InvalidAttemptCountError> {
    if (!Number.isInteger(candidate) || candidate < 0) {
      return Result.failure(new InvalidAttemptCountError(candidate));
    }

    return Result.success(new AttemptCount(candidate));
  }

  static zero(): AttemptCount {
    return new AttemptCount(0);
  }

  increment(): AttemptCount {
    return new AttemptCount(this.value + 1);
  }

  add(count: number | AttemptCount): ResultType<AttemptCount, InvalidAttemptCountError> {
    const addition = typeof count === 'number' ? count : count.value;
    return AttemptCount.create(this.value + addition);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
