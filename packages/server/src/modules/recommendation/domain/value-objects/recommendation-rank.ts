import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidRecommendationScoreError } from '../errors/recommendation-errors.js';

export class RecommendationRank extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(
    candidate: number,
  ): ResultType<RecommendationRank, InvalidRecommendationScoreError> {
    if (!Number.isInteger(candidate) || candidate < 1) {
      return Result.failure(new InvalidRecommendationScoreError('rank', candidate));
    }

    return Result.success(new RecommendationRank(candidate));
  }

  static top(): RecommendationRank {
    return new RecommendationRank(1);
  }

  override toString(): string {
    return `#${this.value}`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
