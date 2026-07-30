import type { Result as ResultType } from '../../../../core/result/result.js';
import type { AIGenerationRequest } from '../../domain/aggregates/ai-generation-request.js';
import type { AIPipelineError } from '../../domain/errors/ai-pipeline-errors.js';
import type {
  AIGenerationResult,
  DifficultyAnalysis,
  DuplicateAnalysis,
  GenerationMetadata,
  PromptTemplate,
  QualityReport,
  ValidationReport,
} from '../../domain/models/generation-models.js';
import type {
  GenerationId,
  PromptText,
} from '../../domain/value-objects/ai-pipeline-value-objects.js';

export type ContextPrimitive = boolean | number | string | null;
export type ContextValue =
  ContextPrimitive | readonly ContextValue[] | { readonly [key: string]: ContextValue };
export interface GenerationContext {
  readonly values: { readonly [key: string]: ContextValue };
}
export interface LLMGenerationInput {
  readonly context: GenerationContext;
  readonly metadata: GenerationMetadata;
  readonly prompt: PromptText;
}

type PortResult<T> = Promise<ResultType<T, AIPipelineError>>;

export interface LLMGateway {
  generate(input: LLMGenerationInput): PortResult<AIGenerationResult>;
}
export interface PromptBuilder {
  build(request: AIGenerationRequest, template: PromptTemplate): PortResult<PromptText>;
}
export interface ContextBuilder {
  build(request: AIGenerationRequest): PortResult<GenerationContext>;
}
export interface PromptValidator {
  validate(prompt: PromptText): PortResult<ValidationReport>;
}
export interface ResponseValidator {
  validate(result: AIGenerationResult): PortResult<ValidationReport>;
}
export interface QualityEvaluator {
  evaluate(result: AIGenerationResult): PortResult<QualityReport>;
}
export interface DifficultyEvaluator {
  evaluate(result: AIGenerationResult, expectedDifficulty: number): PortResult<DifficultyAnalysis>;
}
export interface DuplicateDetector {
  analyze(result: AIGenerationResult): PortResult<DuplicateAnalysis>;
}
export interface PublicationGate {
  publish(request: AIGenerationRequest): PortResult<void>;
}
export interface PromptRepository {
  findActiveByKey(templateKey: string): Promise<PromptTemplate | undefined>;
}
export interface GenerationRepository {
  findById(generationId: GenerationId): Promise<AIGenerationRequest | undefined>;
  save(request: AIGenerationRequest): Promise<void>;
}
