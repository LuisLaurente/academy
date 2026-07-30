import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidSessionValueError } from '../errors/session-errors.js';

export class CompletionRate extends ValueObject {
  readonly value: number;

  private constructor(value: number) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: number): ResultType<CompletionRate, InvalidSessionValueError> {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      return Result.failure(new InvalidSessionValueError('completion rate', candidate));
    }

    return Result.success(new CompletionRate(Number(candidate.toFixed(4))));
  }

  static fromCounts(completed: number, total: number): CompletionRate {
    if (total <= 0) {
      return new CompletionRate(0);
    }

    const rate = Math.min(1, Math.max(0, completed / total));
    return new CompletionRate(Number(rate.toFixed(4)));
  }

  static zero(): CompletionRate {
    return new CompletionRate(0);
  }

  static full(): CompletionRate {
    return new CompletionRate(1);
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
