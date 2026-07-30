import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { GenerationArtifact } from '../../domain/entities/generation-artifact.js';
import { GenerationMetadata } from '../../domain/entities/generation-metadata.js';
import { GenerationRequestNotFoundError } from '../../domain/errors/ai-orchestration-errors.js';
import {
  AIRequestId,
  GenerationArtifactId,
  GenerationMetadataId,
} from '../../domain/identifiers/ai-orchestration-ids.js';
import { GenerationCost } from '../../domain/value-objects/generation-cost.js';
import { GenerationDuration } from '../../domain/value-objects/generation-duration.js';
import { PromptVersion } from '../../domain/value-objects/prompt-version.js';
import { InMemoryGenerationResultStore } from '../../infrastructure/default-services.js';
import type { CompleteGenerationInput } from '../dtos/ai-orchestration-inputs.js';
import type { GenerationRepository } from '../ports/generation-repository.js';
import type { GenerationResultStore } from '../ports/generation-result-store.js';

export class CompleteGeneration {
  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly uuidService: UuidService,
    private readonly resultStore: GenerationResultStore = new InMemoryGenerationResultStore(),
  ) {}

  async execute(input: CompleteGenerationInput): Promise<ResultType<void, DomainError>> {
    const requestId = AIRequestId.create(input.requestId as Uuid);
    const request = await this.generationRepository.findById(requestId);

    if (!request) {
      return Result.failure(new GenerationRequestNotFoundError(input.requestId));
    }

    const artifact = GenerationArtifact.create({
      artifactType: input.artifactType,
      contentPayload: input.contentPayload,
      id: GenerationArtifactId.create(this.uuidService.generate()),
    });

    const promptVersionRes = input.promptVersion
      ? PromptVersion.create(input.promptVersion)
      : Result.success(PromptVersion.default());

    if (!promptVersionRes.isSuccess) {
      return Result.failure(promptVersionRes.error);
    }

    const costRes = GenerationCost.create(input.tokensUsed ?? 0, input.estimatedCostUSD ?? 0);
    const durationRes = GenerationDuration.create(input.durationMs ?? 0);

    const metadata = GenerationMetadata.create({
      cost: costRes.isSuccess ? costRes.value : GenerationCost.zero(),
      duration: durationRes.isSuccess ? durationRes.value : GenerationDuration.zero(),
      id: GenerationMetadataId.create(this.uuidService.generate()),
      modelName: input.modelName ?? 'default-ai-model',
      promptVersion: promptVersionRes.value,
    });

    const completeRes = request.complete(artifact, metadata, this.uuidService.generate());
    if (!completeRes.isSuccess) {
      return completeRes;
    }

    await this.generationRepository.save(request);
    await this.resultStore.storeResult(requestId, artifact, metadata);

    return Result.success(undefined);
  }
}
