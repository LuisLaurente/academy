import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidGenerationValueError } from '../errors/ai-orchestration-errors.js';

export class GenerationCost extends ValueObject {
  readonly tokensUsed: number;
  readonly estimatedCostUSD: number;

  private constructor(tokensUsed: number, estimatedCostUSD: number) {
    super();
    this.tokensUsed = tokensUsed;
    this.estimatedCostUSD = estimatedCostUSD;
    Object.freeze(this);
  }

  static create(
    tokensUsed: number,
    estimatedCostUSD = 0,
  ): ResultType<GenerationCost, InvalidGenerationValueError> {
    if (
      !Number.isInteger(tokensUsed) ||
      tokensUsed < 0 ||
      !Number.isFinite(estimatedCostUSD) ||
      estimatedCostUSD < 0
    ) {
      return Result.failure(
        new InvalidGenerationValueError('cost', `tokens:${tokensUsed}, USD:${estimatedCostUSD}`),
      );
    }

    return Result.success(new GenerationCost(tokensUsed, Number(estimatedCostUSD.toFixed(6))));
  }

  static zero(): GenerationCost {
    return new GenerationCost(0, 0);
  }

  override toString(): string {
    return `${this.tokensUsed} tokens ($${this.estimatedCostUSD})`;
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.tokensUsed, this.estimatedCostUSD];
  }
}
