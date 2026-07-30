import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidRecommendationScoreError } from '../errors/recommendation-errors.js';

export class PriorityScore extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<PriorityScore, InvalidRecommendationScoreError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidRecommendationScoreError('priority', candidate));
    }

    return Result.success(new PriorityScore(Number(candidate.toFixed(4))));
  }

  static min(): PriorityScore {
    return new PriorityScore(0);
  }

  static max(): PriorityScore {
    return new PriorityScore(1);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
