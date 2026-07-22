import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidScoreValueError } from '../errors/learning-errors.js';
import type { AttemptCount } from './attempt-count.js';

export class SuccessRate extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<SuccessRate, InvalidScoreValueError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidScoreValueError('success rate', candidate));
    }

    return Result.success(new SuccessRate(Number(candidate.toFixed(4))));
  }

  static fromAttempts(
    successes: AttemptCount | number,
    totalAttempts: AttemptCount | number,
  ): SuccessRate {
    const successVal = typeof successes === 'number' ? successes : successes.value;
    const totalVal = typeof totalAttempts === 'number' ? totalAttempts : totalAttempts.value;

    if (totalVal <= 0) {
      return new SuccessRate(0);
    }

    const rate = Math.min(1, Math.max(0, successVal / totalVal));
    return new SuccessRate(Number(rate.toFixed(4)));
  }

  static zero(): SuccessRate {
    return new SuccessRate(0);
  }

  get percentage(): number {
    return Number((this.value * 100).toFixed(2));
  }

  override toString(): string {
    return `${this.percentage}%`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}
