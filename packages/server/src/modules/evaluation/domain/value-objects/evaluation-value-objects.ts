import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidEvaluationValueError } from '../errors/evaluation-errors.js';

export class Score extends ValueObject {
  private constructor(readonly value: number) {
    super();
  }
  static create(value: number): ResultType<Score, InvalidEvaluationValueError> {
    return Number.isFinite(value) && value >= 0 && value <= 100
      ? Result.success(new Score(value))
      : Result.failure(new InvalidEvaluationValueError('score'));
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}

export class FeedbackText extends ValueObject {
  private constructor(readonly value: string) {
    super();
  }
  static create(value: string): ResultType<FeedbackText, InvalidEvaluationValueError> {
    const prepared = value.replace(/\r\n?/gu, '\n').trim();
    return prepared.length >= 1 && prepared.length <= 4_000
      ? Result.success(new FeedbackText(prepared))
      : Result.failure(new InvalidEvaluationValueError('feedback'));
  }
  override toString(): string {
    return this.value;
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}

export class ExecutionTime extends ValueObject {
  private constructor(readonly milliseconds: number) {
    super();
  }
  static create(milliseconds: number): ResultType<ExecutionTime, InvalidEvaluationValueError> {
    return Number.isSafeInteger(milliseconds) && milliseconds >= 0 && milliseconds <= 3_600_000
      ? Result.success(new ExecutionTime(milliseconds))
      : Result.failure(new InvalidEvaluationValueError('executionTime'));
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.milliseconds];
  }
}

export class MemoryUsage extends ValueObject {
  private constructor(readonly bytes: number) {
    super();
  }
  static create(bytes: number): ResultType<MemoryUsage, InvalidEvaluationValueError> {
    return Number.isSafeInteger(bytes) && bytes >= 0
      ? Result.success(new MemoryUsage(bytes))
      : Result.failure(new InvalidEvaluationValueError('memoryUsage'));
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.bytes];
  }
}
