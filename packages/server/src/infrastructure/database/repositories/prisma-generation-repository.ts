import type { GenerationRepository } from '../../../modules/ai-orchestration/application/ports/generation-repository.js';
import type { GenerationRequest } from '../../../modules/ai-orchestration/domain/aggregates/generation-request.js';
import type { AIRequestId } from '../../../modules/ai-orchestration/domain/identifiers/ai-orchestration-ids.js';
import { InMemoryGenerationRepository } from '../../../modules/ai-orchestration/infrastructure/repositories/in-memory-generation-repository.js';
import type { DatabaseClient } from '../database-client.js';

export class PrismaGenerationRepository implements GenerationRepository {
  private readonly delegate = new InMemoryGenerationRepository();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: AIRequestId): Promise<GenerationRequest | null> {
    return this.delegate.findById(id);
  }

  async findPending(): Promise<readonly GenerationRequest[]> {
    return this.delegate.findPending();
  }

  async save(request: GenerationRequest): Promise<void> {
    await this.delegate.save(request);
  }

  async delete(id: AIRequestId): Promise<void> {
    await this.delegate.delete(id);
  }
}
