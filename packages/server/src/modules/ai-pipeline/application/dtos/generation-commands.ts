import type {
  GenerationStatus,
  GeneratorType,
  RejectedReason,
} from '../../domain/types/ai-pipeline-types.js';
import type { GenerationId } from '../../domain/value-objects/ai-pipeline-value-objects.js';

export interface CreateGenerationRequestInput {
  readonly generator: GeneratorType;
  readonly maximumSimilarity: number;
  readonly maxTokens: number;
  readonly minimumConfidence: number;
  readonly minimumQuality: number;
  readonly modelName: string;
  readonly targetDifficulty: number;
  readonly temperature: number;
  readonly templateKey: string;
  readonly topP: number;
}

export interface GenerationStateOutput {
  readonly generationId: GenerationId;
  readonly status: GenerationStatus;
  readonly version: number;
}

export interface GenerationIdInput {
  readonly generationId: GenerationId;
}
export interface RejectGenerationInput extends GenerationIdInput {
  readonly reason: RejectedReason;
}
