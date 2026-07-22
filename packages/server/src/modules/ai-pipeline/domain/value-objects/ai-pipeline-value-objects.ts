import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';
import { InvalidAIValueError } from '../errors/ai-pipeline-errors.js';

export class GenerationId extends EntityId<'AIGenerationRequest'> {
  static create(value: Uuid): GenerationId {
    return new GenerationId(value);
  }
}

abstract class StringValue extends ValueObject {
  readonly value: string;
  protected constructor(value: string) {
    super();
    this.value = value;
  }
  override toString(): string {
    return this.value;
  }
  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}

export class PromptText extends StringValue {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(candidate: string): ResultType<PromptText, InvalidAIValueError> {
    const value = candidate.replace(/\r\n?/gu, '\n').trim();
    return value.length >= 1 && value.length <= 100_000
      ? Result.success(new PromptText(value))
      : Result.failure(new InvalidAIValueError('promptText', 'length:1..100000'));
  }
}

export class ModelName extends StringValue {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }
  static create(candidate: string): ResultType<ModelName, InvalidAIValueError> {
    const value = candidate.trim();
    return value.length >= 1 && value.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(value)
      ? Result.success(new ModelName(value))
      : Result.failure(new InvalidAIValueError('modelName', 'provider-neutral-name'));
  }
}

abstract class NumericValue extends ValueObject {
  readonly value: number;
  protected constructor(value: number) {
    super();
    this.value = value;
  }
  protected getEqualityComponents(): readonly number[] {
    return [this.value];
  }
}

export class Temperature extends NumericValue {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<Temperature, InvalidAIValueError> {
    return Number.isFinite(value) && value >= 0 && value <= 2
      ? Result.success(new Temperature(value))
      : Result.failure(new InvalidAIValueError('temperature', 'range:0..2'));
  }
}

export class TopP extends NumericValue {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<TopP, InvalidAIValueError> {
    return Number.isFinite(value) && value > 0 && value <= 1
      ? Result.success(new TopP(value))
      : Result.failure(new InvalidAIValueError('topP', 'range:>0..1'));
  }
}

export class MaxTokens extends NumericValue {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<MaxTokens, InvalidAIValueError> {
    return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000
      ? Result.success(new MaxTokens(value))
      : Result.failure(new InvalidAIValueError('maxTokens', 'positive-safe-integer:<=1000000'));
  }
}

export class QualityScore extends NumericValue {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<QualityScore, InvalidAIValueError> {
    return Number.isFinite(value) && value >= 0 && value <= 100
      ? Result.success(new QualityScore(value))
      : Result.failure(new InvalidAIValueError('qualityScore', 'range:0..100'));
  }
}

abstract class ProbabilityScore extends NumericValue {
  protected static valid(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 1;
  }
}

export class ConfidenceScore extends ProbabilityScore {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<ConfidenceScore, InvalidAIValueError> {
    return this.valid(value)
      ? Result.success(new ConfidenceScore(value))
      : Result.failure(new InvalidAIValueError('confidenceScore', 'range:0..1'));
  }
}

export class SimilarityScore extends ProbabilityScore {
  private constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
  static create(value: number): ResultType<SimilarityScore, InvalidAIValueError> {
    return this.valid(value)
      ? Result.success(new SimilarityScore(value))
      : Result.failure(new InvalidAIValueError('similarityScore', 'range:0..1'));
  }
}
