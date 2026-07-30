import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidGenerationValueError } from '../errors/ai-orchestration-errors.js';

export class PromptVersion extends ValueObject {
  readonly version: string;

  private constructor(version: string) {
    super();
    this.version = version;
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<PromptVersion, InvalidGenerationValueError> {
    if (!candidate || candidate.trim().length === 0) {
      return Result.failure(new InvalidGenerationValueError('promptVersion', candidate));
    }

    return Result.success(new PromptVersion(candidate.trim()));
  }

  static default(): PromptVersion {
    return new PromptVersion('v1.0.0');
  }

  override toString(): string {
    return this.version;
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.version];
  }
}
