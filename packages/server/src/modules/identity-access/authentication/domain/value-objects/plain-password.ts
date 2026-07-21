import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import { ValueObject } from '../../../../../core/value-objects/value-object.js';
import { WeakPasswordError } from '../errors/authentication-errors.js';

export class PlainPassword extends ValueObject {
  readonly #value: string;

  private constructor(value: string) {
    super();
    this.#value = value;
    Object.freeze(this);
  }

  static create(
    candidate: string,
    minimumLength: number,
  ): ResultType<PlainPassword, WeakPasswordError> {
    if (!Number.isSafeInteger(minimumLength) || minimumLength < 1) {
      throw new RangeError('Minimum password length must be a positive safe integer.');
    }

    if (candidate.trim().length === 0 || candidate.length < minimumLength) {
      return Result.failure(new WeakPasswordError(minimumLength));
    }

    return Result.success(new PlainPassword(candidate));
  }

  reveal(): string {
    return this.#value;
  }

  override toString(): string {
    return '[REDACTED]';
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.#value];
  }
}
