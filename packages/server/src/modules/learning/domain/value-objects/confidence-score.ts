import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidScoreValueError } from '../errors/learning-errors.js';

export class ConfidenceScore extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<ConfidenceScore, InvalidScoreValueError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidScoreValueError('confidence', candidate));
    }

    return Result.success(new ConfidenceScore(Number(candidate.toFixed(4))));
  }

  static zero(): ConfidenceScore {
    return new ConfidenceScore(0);
  }

  static default(): ConfidenceScore {
    return new ConfidenceScore(0.5);
  }

  static max(): ConfidenceScore {
    return new ConfidenceScore(1);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
