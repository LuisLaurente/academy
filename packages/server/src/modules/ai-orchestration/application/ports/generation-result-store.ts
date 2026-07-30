import type { GenerationArtifact } from '../../domain/entities/generation-artifact.js';
import type { GenerationMetadata } from '../../domain/entities/generation-metadata.js';
import type { AIRequestId } from '../../domain/identifiers/ai-orchestration-ids.js';

export interface GenerationResultRecord {
  readonly artifact: GenerationArtifact;
  readonly metadata: GenerationMetadata;
}

export interface GenerationResultStore {
  getResult(requestId: AIRequestId): Promise<GenerationResultRecord | null>;
  storeResult(
    requestId: AIRequestId,
    artifact: GenerationArtifact,
    metadata: GenerationMetadata,
  ): Promise<void>;
}
