import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidMasteryScoreError } from '../errors/learning-errors.js';

export class MasteryScore extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<MasteryScore, InvalidMasteryScoreError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidMasteryScoreError(candidate));
    }

    return Result.success(new MasteryScore(Number(candidate.toFixed(4))));
  }

  static zero(): MasteryScore {
    return new MasteryScore(0);
  }

  static max(): MasteryScore {
    return new MasteryScore(1);
  }

  isMastered(threshold = 0.85): boolean {
    return this.value >= threshold;
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
