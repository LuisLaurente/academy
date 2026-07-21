import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import { ValueObject } from '../../../../../core/value-objects/value-object.js';
import { InvalidHashedPasswordError } from '../errors/authentication-errors.js';

export class HashedPassword extends ValueObject {
  readonly #value: string;

  private constructor(value: string) {
    super();
    this.#value = value;
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<HashedPassword, InvalidHashedPasswordError> {
    if (candidate.trim().length === 0) {
      return Result.failure(new InvalidHashedPasswordError());
    }

    return Result.success(new HashedPassword(candidate));
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
