import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidReviewIntervalError } from '../errors/learning-errors.js';

export class ReviewInterval extends ValueObject {
  readonly inDays: number;

  private constructor(inDays: number) {
    super();
    this.inDays = inDays;
    Object.freeze(this);
  }

  static create(candidateDays: number): ResultType<ReviewInterval, InvalidReviewIntervalError> {
    if (!Number.isFinite(candidateDays) || candidateDays < 0) {
      return Result.failure(new InvalidReviewIntervalError(candidateDays));
    }

    return Result.success(new ReviewInterval(Number(candidateDays.toFixed(2))));
  }

  static zero(): ReviewInterval {
    return new ReviewInterval(0);
  }

  static fromDays(days: number): ResultType<ReviewInterval, InvalidReviewIntervalError> {
    return ReviewInterval.create(days);
  }

  static fromHours(hours: number): ResultType<ReviewInterval, InvalidReviewIntervalError> {
    return ReviewInterval.create(hours / 24);
  }

  get inHours(): number {
    return this.inDays * 24;
  }

  get inMilliseconds(): number {
    return this.inDays * 24 * 60 * 60 * 1000;
  }

  override toString(): string {
    return `${this.inDays} days`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.inDays];
  }
}
