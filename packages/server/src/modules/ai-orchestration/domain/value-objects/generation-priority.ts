import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidGenerationValueError } from '../errors/ai-orchestration-errors.js';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export class GenerationPriority extends ValueObject {
  readonly level: PriorityLevel;
  readonly weight: number;

  private constructor(level: PriorityLevel) {
    super();
    this.level = level;
    this.weight = PRIORITY_WEIGHTS[level];
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<GenerationPriority, InvalidGenerationValueError> {
    const normalized = candidate.toLowerCase() as PriorityLevel;
    if (!(normalized in PRIORITY_WEIGHTS)) {
      return Result.failure(new InvalidGenerationValueError('priority', candidate));
    }

    return Result.success(new GenerationPriority(normalized));
  }

  static low(): GenerationPriority {
    return new GenerationPriority('low');
  }

  static medium(): GenerationPriority {
    return new GenerationPriority('medium');
  }

  static high(): GenerationPriority {
    return new GenerationPriority('high');
  }

  static urgent(): GenerationPriority {
    return new GenerationPriority('urgent');
  }

  override toString(): string {
    return this.level;
  }

  protected getEqualityComponents(): readonly (string | number)[] {
    return [this.level, this.weight];
  }
}
