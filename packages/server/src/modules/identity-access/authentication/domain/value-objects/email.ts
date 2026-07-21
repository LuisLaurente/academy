import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import { ValueObject } from '../../../../../core/value-objects/value-object.js';
import { InvalidEmailError } from '../errors/authentication-errors.js';

const MAXIMUM_EMAIL_LENGTH = 254;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject {
  readonly value: string;

  private constructor(value: string) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<Email, InvalidEmailError> {
    const normalizedEmail = candidate.trim().toLowerCase();

    if (
      normalizedEmail.length === 0 ||
      normalizedEmail.length > MAXIMUM_EMAIL_LENGTH ||
      !BASIC_EMAIL_PATTERN.test(normalizedEmail)
    ) {
      return Result.failure(new InvalidEmailError());
    }

    return Result.success(new Email(normalizedEmail));
  }

  override toString(): string {
    return this.value;
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}
