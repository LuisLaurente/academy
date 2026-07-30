import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import type {
  GenerationExecutionResult,
  GenerationExecutor,
} from '../application/ports/generation-executor.js';
import type { GenerationPolicy } from '../application/ports/generation-policy.js';
import type {
  GenerationResultRecord,
  GenerationResultStore,
} from '../application/ports/generation-result-store.js';
import type { PromptProvider, PromptTemplateResult } from '../application/ports/prompt-provider.js';
import type { GenerationRequest } from '../domain/aggregates/generation-request.js';
import { GenerationArtifact } from '../domain/entities/generation-artifact.js';
import { GenerationMetadata } from '../domain/entities/generation-metadata.js';
import type { AIRequestId } from '../domain/identifiers/ai-orchestration-ids.js';
import {
  GenerationArtifactId,
  GenerationMetadataId,
} from '../domain/identifiers/ai-orchestration-ids.js';
import { GenerationCost } from '../domain/value-objects/generation-cost.js';
import { GenerationDuration } from '../domain/value-objects/generation-duration.js';
import { PromptVersion } from '../domain/value-objects/prompt-version.js';

const uuidService = new CryptoUuidService();

export class DefaultPromptProvider implements PromptProvider {
  async getPromptTemplate(
    requestType: string,
    version?: PromptVersion,
  ): Promise<PromptTemplateResult> {
    const promptVer = version ?? PromptVersion.default();
    const template = `Template for [${requestType}] version ${promptVer.version}`;

    return Object.freeze({
      template,
      version: promptVer,
    });
  }
}

export class DefaultGenerationExecutor implements GenerationExecutor {
  async executeGeneration(
    request: GenerationRequest,
    template: string,
  ): Promise<GenerationExecutionResult> {
    void template;
    const artifact = GenerationArtifact.create({
      artifactType: `${request.requestType}_result`,
      contentPayload: `Simulated payload for ${request.id.toString()}`,
      id: GenerationArtifactId.create(uuidService.generate()),
    });

    const costRes = GenerationCost.create(150, 0.0015);
    const durationRes = GenerationDuration.create(1200);

    const metadata = GenerationMetadata.create({
      cost: costRes.isSuccess ? costRes.value : GenerationCost.zero(),
      duration: durationRes.isSuccess ? durationRes.value : GenerationDuration.zero(),
      id: GenerationMetadataId.create(uuidService.generate()),
      modelName: 'simulated-ai-model-v1',
      promptVersion: PromptVersion.default(),
    });

    return Object.freeze({ artifact, metadata });
  }
}

export class DefaultGenerationPolicy implements GenerationPolicy {
  canRequestGeneration(requestType: string): boolean {
    return requestType.length > 0;
  }

  maxAttemptsPerRequest(): number {
    return 3;
  }
}

export class InMemoryGenerationResultStore implements GenerationResultStore {
  private readonly results = new Map<string, GenerationResultRecord>();

  async storeResult(
    requestId: AIRequestId,
    artifact: GenerationArtifact,
    metadata: GenerationMetadata,
  ): Promise<void> {
    this.results.set(requestId.toString(), { artifact, metadata });
  }

  async getResult(requestId: AIRequestId): Promise<GenerationResultRecord | null> {
    const record = this.results.get(requestId.toString());
    return record ?? null;
  }

  clear(): void {
    this.results.clear();
  }

  get count(): number {
    return this.results.size;
  }
}
