import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidGenerationValueError } from '../errors/ai-orchestration-errors.js';

export class GenerationDuration extends ValueObject {
  readonly durationMs: number;

  private constructor(durationMs: number) {
    super();
    this.durationMs = durationMs;
    Object.freeze(this);
  }

  static create(durationMs: number): ResultType<GenerationDuration, InvalidGenerationValueError> {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return Result.failure(new InvalidGenerationValueError('duration', durationMs));
    }

    return Result.success(new GenerationDuration(Math.round(durationMs)));
  }

  static between(
    start: Date,
    end: Date,
  ): ResultType<GenerationDuration, InvalidGenerationValueError> {
    const diff = end.getTime() - start.getTime();
    return GenerationDuration.create(diff);
  }

  static zero(): GenerationDuration {
    return new GenerationDuration(0);
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
