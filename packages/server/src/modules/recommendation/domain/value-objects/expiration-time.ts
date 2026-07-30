import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidRecommendationStateError } from '../errors/recommendation-errors.js';

export class ExpirationTime extends ValueObject {
  readonly value: Date;

  private constructor(value: Date) {
    super();
    this.value = new Date(value.getTime());
    Object.freeze(this);
  }

  static create(date: Date): ResultType<ExpirationTime, InvalidRecommendationStateError> {
    if (!Number.isFinite(date.getTime())) {
      return Result.failure(new InvalidRecommendationStateError('Invalid expiration date'));
    }

    return Result.success(new ExpirationTime(date));
  }

  static fromHours(
    hours: number,
    relativeTo = new Date(),
  ): ResultType<ExpirationTime, InvalidRecommendationStateError> {
    if (!Number.isFinite(hours)) {
      return Result.failure(
        new InvalidRecommendationStateError('Expiration hours must be a finite number'),
      );
    }

    const expires = new Date(relativeTo.getTime() + hours * 3600 * 1000);
    return ExpirationTime.create(expires);
  }

  isExpired(now = new Date()): boolean {
    return now.getTime() >= this.value.getTime();
  }

  override toString(): string {
    return this.value.toISOString();
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.value.toISOString()];
  }
}
