import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidGenerationValueError } from '../errors/ai-orchestration-errors.js';

export class GenerationAttempts extends ValueObject {
  readonly current: number;
  readonly max: number;

  private constructor(current: number, max: number) {
    super();
    this.current = current;
    this.max = max;
    Object.freeze(this);
  }

  static create(
    current: number,
    max = 3,
  ): ResultType<GenerationAttempts, InvalidGenerationValueError> {
    if (!Number.isInteger(current) || current < 0 || !Number.isInteger(max) || max <= 0) {
      return Result.failure(
        new InvalidGenerationValueError('attempts', `current:${current}, max:${max}`),
      );
    }

    return Result.success(new GenerationAttempts(current, max));
  }

  static initial(max = 3): GenerationAttempts {
    return new GenerationAttempts(0, max);
  }

  get canRetry(): boolean {
    return this.current < this.max;
  }

  increment(): ResultType<GenerationAttempts, InvalidGenerationValueError> {
    return GenerationAttempts.create(this.current + 1, this.max);
  }

  override toString(): string {
    return `${this.current}/${this.max}`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.current, this.max];
  }
}
