import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { InvalidAIValueError, InvalidGenerationDateError } from '../errors/ai-pipeline-errors.js';
import type { GeneratorType } from '../types/ai-pipeline-types.js';
import type {
  ConfidenceScore,
  MaxTokens,
  ModelName,
  QualityScore,
  SimilarityScore,
  Temperature,
  TopP,
} from '../value-objects/ai-pipeline-value-objects.js';

export interface PromptTemplateState {
  readonly active: boolean;
  readonly generator: GeneratorType;
  readonly key: string;
  readonly purpose: string;
  readonly version: number;
}

export class PromptTemplate {
  readonly active: boolean;
  readonly generator: GeneratorType;
  readonly key: string;
  readonly purpose: string;
  readonly version: number;

  private constructor(state: PromptTemplateState) {
    this.active = state.active;
    this.generator = state.generator;
    this.key = state.key;
    this.purpose = state.purpose;
    this.version = state.version;
    Object.freeze(this);
  }

  static create(state: PromptTemplateState): ResultType<PromptTemplate, InvalidAIValueError> {
    const key = normalizeLabel(state.key);
    const purpose = normalizeLabel(state.purpose);
    if (key.length < 1 || key.length > 120 || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u.test(key)) {
      return Result.failure(new InvalidAIValueError('templateKey', 'lowercase-stable-key'));
    }
    if (purpose.length < 2 || purpose.length > 160) {
      return Result.failure(new InvalidAIValueError('templatePurpose', 'length:2..160'));
    }
    if (!Number.isSafeInteger(state.version) || state.version < 1) {
      return Result.failure(new InvalidAIValueError('templateVersion', 'positive-safe-integer'));
    }
    return Result.success(new PromptTemplate({ ...state, key, purpose }));
  }
}

export interface GenerationPolicyState {
  readonly maximumSimilarity: SimilarityScore;
  readonly minimumConfidence: ConfidenceScore;
  readonly minimumQuality: QualityScore;
  readonly targetDifficulty: number;
}

export class GenerationPolicy {
  readonly humanApprovalRequired = true;
  readonly maximumSimilarity: SimilarityScore;
  readonly minimumConfidence: ConfidenceScore;
  readonly minimumQuality: QualityScore;
  readonly targetDifficulty: 1 | 2 | 3 | 4 | 5;

  private constructor(state: GenerationPolicyState) {
    this.maximumSimilarity = state.maximumSimilarity;
    this.minimumConfidence = state.minimumConfidence;
    this.minimumQuality = state.minimumQuality;
    this.targetDifficulty = state.targetDifficulty as 1 | 2 | 3 | 4 | 5;
    Object.freeze(this);
  }

  static create(state: GenerationPolicyState): ResultType<GenerationPolicy, InvalidAIValueError> {
    return Number.isInteger(state.targetDifficulty) &&
      state.targetDifficulty >= 1 &&
      state.targetDifficulty <= 5
      ? Result.success(new GenerationPolicy(state))
      : Result.failure(new InvalidAIValueError('targetDifficulty', 'integer:1..5'));
  }
}

export interface GenerationMetadataState {
  readonly generator: GeneratorType;
  readonly maxTokens: MaxTokens;
  readonly modelName: ModelName;
  readonly temperature: Temperature;
  readonly template: PromptTemplate;
  readonly topP: TopP;
}

export class GenerationMetadata {
  readonly generator: GeneratorType;
  readonly maxTokens: MaxTokens;
  readonly modelName: ModelName;
  readonly temperature: Temperature;
  readonly template: PromptTemplate;
  readonly topP: TopP;

  private constructor(state: GenerationMetadataState) {
    this.generator = state.generator;
    this.maxTokens = state.maxTokens;
    this.modelName = state.modelName;
    this.temperature = state.temperature;
    this.template = state.template;
    this.topP = state.topP;
    Object.freeze(this);
  }

  static create(
    state: GenerationMetadataState,
  ): ResultType<GenerationMetadata, InvalidAIValueError> {
    if (!state.template.active) {
      return Result.failure(new InvalidAIValueError('template', 'active'));
    }
    if (state.template.generator !== state.generator) {
      return Result.failure(new InvalidAIValueError('generator', 'matches-template'));
    }
    return Result.success(new GenerationMetadata(state));
  }
}

export class ValidationReport {
  readonly confidence: ConfidenceScore;
  readonly findings: readonly string[];
  readonly passed: boolean;

  private constructor(passed: boolean, findings: readonly string[], confidence: ConfidenceScore) {
    this.passed = passed;
    this.findings = Object.freeze([...findings]);
    this.confidence = confidence;
    Object.freeze(this);
  }

  static create(state: {
    readonly confidence: ConfidenceScore;
    readonly findings?: readonly string[];
    readonly passed: boolean;
  }): ResultType<ValidationReport, InvalidAIValueError> {
    const findings = (state.findings ?? []).map(normalizeLabel);
    if (findings.some((finding) => finding.length < 1 || finding.length > 500)) {
      return Result.failure(new InvalidAIValueError('validationFinding', 'length:1..500'));
    }
    if (state.passed && findings.length > 0) {
      return Result.failure(new InvalidAIValueError('validationFindings', 'empty-when-passed'));
    }
    if (!state.passed && findings.length === 0) {
      return Result.failure(new InvalidAIValueError('validationFindings', 'required-when-failed'));
    }
    return Result.success(new ValidationReport(state.passed, findings, state.confidence));
  }

  static combine(first: ValidationReport, second: ValidationReport): ValidationReport {
    return new ValidationReport(
      first.passed && second.passed,
      [...first.findings, ...second.findings],
      first.confidence.value <= second.confidence.value ? first.confidence : second.confidence,
    );
  }
}

export class QualityReport {
  constructor(
    readonly score: QualityScore,
    readonly confidence: ConfidenceScore,
  ) {
    Object.freeze(this);
  }
  passes(policy: GenerationPolicy): boolean {
    return (
      this.score.value >= policy.minimumQuality.value &&
      this.confidence.value >= policy.minimumConfidence.value
    );
  }
}

export class DuplicateAnalysis {
  constructor(
    readonly similarity: SimilarityScore,
    readonly confidence: ConfidenceScore,
  ) {
    Object.freeze(this);
  }
  passes(policy: GenerationPolicy): boolean {
    return (
      this.similarity.value <= policy.maximumSimilarity.value &&
      this.confidence.value >= policy.minimumConfidence.value
    );
  }
}

export class DifficultyAnalysis {
  readonly confidence: ConfidenceScore;
  readonly expected: 1 | 2 | 3 | 4 | 5;
  readonly observed: 1 | 2 | 3 | 4 | 5;

  private constructor(expected: number, observed: number, confidence: ConfidenceScore) {
    this.expected = expected as 1 | 2 | 3 | 4 | 5;
    this.observed = observed as 1 | 2 | 3 | 4 | 5;
    this.confidence = confidence;
    Object.freeze(this);
  }

  static create(state: {
    readonly confidence: ConfidenceScore;
    readonly expected: number;
    readonly observed: number;
  }): ResultType<DifficultyAnalysis, InvalidAIValueError> {
    return isDifficulty(state.expected) && isDifficulty(state.observed)
      ? Result.success(new DifficultyAnalysis(state.expected, state.observed, state.confidence))
      : Result.failure(new InvalidAIValueError('difficultyAnalysis', 'integers:1..5'));
  }

  passes(policy: GenerationPolicy): boolean {
    return (
      this.expected === policy.targetDifficulty &&
      this.observed === this.expected &&
      this.confidence.value >= policy.minimumConfidence.value
    );
  }
}

export class AIGenerationResult {
  readonly content: string;
  readonly metadata: GenerationMetadata;
  readonly #completedAtEpoch: number;

  private constructor(content: string, metadata: GenerationMetadata, completedAt: Date) {
    this.content = content;
    this.metadata = metadata;
    this.#completedAtEpoch = completedAt.getTime();
    Object.freeze(this);
  }

  static create(state: {
    readonly completedAt: Date;
    readonly content: string;
    readonly metadata: GenerationMetadata;
  }): ResultType<AIGenerationResult, InvalidAIValueError | InvalidGenerationDateError> {
    const content = state.content.replace(/\r\n?/gu, '\n').trim();
    if (content.length < 1 || content.length > 1_000_000) {
      return Result.failure(new InvalidAIValueError('generationResult', 'length:1..1000000'));
    }
    if (!Number.isFinite(state.completedAt.getTime())) {
      return Result.failure(new InvalidGenerationDateError('completedAt'));
    }
    return Result.success(new AIGenerationResult(content, state.metadata, state.completedAt));
  }

  get completedAt(): Date {
    return new Date(this.#completedAtEpoch);
  }
}

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}
function isDifficulty(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
