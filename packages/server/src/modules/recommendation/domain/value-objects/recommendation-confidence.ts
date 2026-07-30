import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidRecommendationScoreError } from '../errors/recommendation-errors.js';

export class RecommendationConfidence extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(
    candidate: number,
  ): ResultType<RecommendationConfidence, InvalidRecommendationScoreError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidRecommendationScoreError('confidence', candidate));
    }

    return Result.success(new RecommendationConfidence(Number(candidate.toFixed(4))));
  }

  static default(): RecommendationConfidence {
    return new RecommendationConfidence(0.5);
  }

  static max(): RecommendationConfidence {
    return new RecommendationConfidence(1.0);
  }

  override toString(): string {
    return this.value.toString();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
