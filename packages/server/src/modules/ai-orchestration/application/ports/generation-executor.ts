import type { GenerationRequest } from '../../domain/aggregates/generation-request.js';
import type { GenerationArtifact } from '../../domain/entities/generation-artifact.js';
import type { GenerationMetadata } from '../../domain/entities/generation-metadata.js';

export interface GenerationExecutionResult {
  readonly artifact: GenerationArtifact;
  readonly metadata: GenerationMetadata;
}

export interface GenerationExecutor {
  executeGeneration(
    request: GenerationRequest,
    template: string,
  ): Promise<GenerationExecutionResult>;
}
