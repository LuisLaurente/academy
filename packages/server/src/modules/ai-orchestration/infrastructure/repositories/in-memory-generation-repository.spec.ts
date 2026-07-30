import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { GenerationRequest } from '../../domain/aggregates/generation-request.js';
import { AIRequestId, GenerationJobId } from '../../domain/identifiers/ai-orchestration-ids.js';
import { InMemoryGenerationRepository } from './in-memory-generation-repository.js';

const uuidService = new CryptoUuidService();

describe('InMemoryGenerationRepository', () => {
  it('saves, retrieves, finds pending requests, and deletes', async () => {
    const repo = new InMemoryGenerationRepository();

    const pending1 = GenerationRequest.create({
      id: AIRequestId.create(uuidService.generate()),
      requestType: 'exercise_generation',
    });

    const pending2 = GenerationRequest.create({
      id: AIRequestId.create(uuidService.generate()),
      requestType: 'content_generation',
    });

    const running = GenerationRequest.create({
      id: AIRequestId.create(uuidService.generate()),
      requestType: 'explanation_generation',
    });
    running.start(GenerationJobId.create(uuidService.generate()));

    await repo.save(pending1);
    await repo.save(pending2);
    await repo.save(running);

    expect(repo.count).toBe(3);

    const pending = await repo.findPending();
    expect(pending.length).toBe(2);

    const found = await repo.findById(pending1.id);
    expect(found).not.toBeNull();
    expect(found?.id.equals(pending1.id)).toBe(true);

    await repo.delete(pending1.id);
    expect(repo.count).toBe(2);

    repo.clear();
    expect(repo.count).toBe(0);
  });
});
