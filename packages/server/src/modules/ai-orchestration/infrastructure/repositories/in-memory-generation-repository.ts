import type { GenerationRepository } from '../../application/ports/generation-repository.js';
import type { GenerationRequest } from '../../domain/aggregates/generation-request.js';
import type { AIRequestId } from '../../domain/identifiers/ai-orchestration-ids.js';

export class InMemoryGenerationRepository implements GenerationRepository {
  private readonly requests = new Map<string, GenerationRequest>();

  async findById(id: AIRequestId): Promise<GenerationRequest | null> {
    const req = this.requests.get(id.toString());
    return req ?? null;
  }

  async findPending(): Promise<readonly GenerationRequest[]> {
    const pending: GenerationRequest[] = [];
    for (const req of this.requests.values()) {
      if (req.status === 'pending') {
        pending.push(req);
      }
    }
    return Object.freeze(pending);
  }

  async save(request: GenerationRequest): Promise<void> {
    this.requests.set(request.id.toString(), request);
  }

  async delete(id: AIRequestId): Promise<void> {
    this.requests.delete(id.toString());
  }

  clear(): void {
    this.requests.clear();
  }

  get count(): number {
    return this.requests.size;
  }
}
