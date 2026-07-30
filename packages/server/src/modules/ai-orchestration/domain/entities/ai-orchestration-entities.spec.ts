import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { GenerationArtifactId, GenerationMetadataId } from '../identifiers/ai-orchestration-ids.js';
import { GenerationCost } from '../value-objects/generation-cost.js';
import { GenerationDuration } from '../value-objects/generation-duration.js';
import { PromptVersion } from '../value-objects/prompt-version.js';
import { GenerationArtifact } from './generation-artifact.js';
import { GenerationMetadata } from './generation-metadata.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('AI Orchestration domain entities', () => {
  describe('GenerationArtifact', () => {
    it('creates GenerationArtifact entity', () => {
      const artifactId = GenerationArtifactId.create(uuidService.generate());
      const artifact = GenerationArtifact.create({
        artifactType: 'exercise_batch',
        contentPayload: '{"exercises": []}',
        id: artifactId,
      });

      expect(artifact.id.equals(artifactId)).toBe(true);
      expect(artifact.artifactType).toBe('exercise_batch');
      expect(artifact.contentPayload).toBe('{"exercises": []}');
      expect(artifact.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('GenerationMetadata', () => {
    it('creates GenerationMetadata entity', () => {
      const metadataId = GenerationMetadataId.create(uuidService.generate());
      const cost = unwrap(GenerationCost.create(200, 0.002));
      const duration = unwrap(GenerationDuration.create(1500));
      const promptVersion = PromptVersion.default();

      const metadata = GenerationMetadata.create({
        cost,
        duration,
        id: metadataId,
        modelName: 'gemini-1.5-flash',
        promptVersion,
      });

      expect(metadata.id.equals(metadataId)).toBe(true);
      expect(metadata.modelName).toBe('gemini-1.5-flash');
      expect(metadata.cost.tokensUsed).toBe(200);
      expect(metadata.duration.durationMs).toBe(1500);
    });
  });
});
