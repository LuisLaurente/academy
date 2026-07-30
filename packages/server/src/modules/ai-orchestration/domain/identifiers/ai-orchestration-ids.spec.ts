import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import {
  AIRequestId,
  GenerationArtifactId,
  GenerationJobId,
  GenerationMetadataId,
} from './ai-orchestration-ids.js';

const uuidService = new CryptoUuidService();

describe('AI Orchestration identifiers', () => {
  it('creates AIRequestId and tests equality', () => {
    const raw = uuidService.generate();
    const id1 = AIRequestId.create(raw);
    const id2 = AIRequestId.create(raw);
    const id3 = AIRequestId.create(uuidService.generate());

    expect(id1.value).toBe(raw);
    expect(id1.toString()).toBe(raw);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates GenerationJobId, GenerationArtifactId, GenerationMetadataId', () => {
    const raw1 = uuidService.generate();
    const raw2 = uuidService.generate();
    const raw3 = uuidService.generate();

    const jobId = GenerationJobId.create(raw1);
    const artifactId = GenerationArtifactId.create(raw2);
    const metadataId = GenerationMetadataId.create(raw3);

    expect(jobId.value).toBe(raw1);
    expect(artifactId.value).toBe(raw2);
    expect(metadataId.value).toBe(raw3);
  });
});
