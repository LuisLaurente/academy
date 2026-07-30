import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidRecommendationScoreError } from '../errors/recommendation-errors.js';

export class RecommendationWeight extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(
    candidate: number,
  ): ResultType<RecommendationWeight, InvalidRecommendationScoreError> {
    if (!Number.isFinite(candidate) || candidate < 0) {
      return Result.failure(new InvalidRecommendationScoreError('weight', candidate));
    }

    return Result.success(new RecommendationWeight(Number(candidate.toFixed(4))));
  }

  static default(): RecommendationWeight {
    return new RecommendationWeight(1.0);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
