import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidScoreValueError } from '../errors/learning-errors.js';

export class RetentionScore extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<RetentionScore, InvalidScoreValueError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidScoreValueError('retention', candidate));
    }

    return Result.success(new RetentionScore(Number(candidate.toFixed(4))));
  }

  static zero(): RetentionScore {
    return new RetentionScore(0);
  }

  static max(): RetentionScore {
    return new RetentionScore(1);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
