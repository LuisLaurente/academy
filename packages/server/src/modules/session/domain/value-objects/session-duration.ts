import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidSessionValueError } from '../errors/session-errors.js';

export class SessionDuration extends ValueObject {
  readonly inMilliseconds: number;

  private constructor(inMilliseconds: number) {
    super();
    this.inMilliseconds = inMilliseconds;
    Object.freeze(this);
  }

  static create(durationMs: number): ResultType<SessionDuration, InvalidSessionValueError> {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return Result.failure(new InvalidSessionValueError('duration', durationMs));
    }

    return Result.success(new SessionDuration(Math.round(durationMs)));
  }

  static zero(): SessionDuration {
    return new SessionDuration(0);
  }

  static between(start: Date, end: Date): ResultType<SessionDuration, InvalidSessionValueError> {
    const diff = end.getTime() - start.getTime();
    return SessionDuration.create(diff);
  }

  get inSeconds(): number {
    return Number((this.inMilliseconds / 1000).toFixed(2));
  }

  get inMinutes(): number {
    return Number((this.inMilliseconds / (1000 * 60)).toFixed(2));
  }

  override toString(): string {
    return `${this.inMinutes} mins`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.inMilliseconds];
  }
}
