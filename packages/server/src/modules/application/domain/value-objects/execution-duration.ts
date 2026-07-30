import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidWorkflowValueError } from '../errors/application-errors.js';

export class ExecutionDuration extends ValueObject {
  readonly durationMs: number;

  private constructor(durationMs: number) {
    super();
    this.durationMs = durationMs;
    Object.freeze(this);
  }

  static create(durationMs: number): ResultType<ExecutionDuration, InvalidWorkflowValueError> {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return Result.failure(new InvalidWorkflowValueError('executionDuration', durationMs));
    }

    return Result.success(new ExecutionDuration(Math.round(durationMs)));
  }

  static between(start: Date, end: Date): ResultType<ExecutionDuration, InvalidWorkflowValueError> {
    const diff = end.getTime() - start.getTime();
    return ExecutionDuration.create(diff);
  }

  static zero(): ExecutionDuration {
    return new ExecutionDuration(0);
  }

  get inSeconds(): number {
    return Number((this.durationMs / 1000).toFixed(2));
  }

  override toString(): string {
    return `${this.inSeconds}s`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.durationMs];
  }
}
