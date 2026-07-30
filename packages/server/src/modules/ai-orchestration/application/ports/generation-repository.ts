import type { GenerationRequest } from '../../domain/aggregates/generation-request.js';
import type { AIRequestId } from '../../domain/identifiers/ai-orchestration-ids.js';

export interface GenerationRepository {
  delete(id: AIRequestId): Promise<void>;
  findById(id: AIRequestId): Promise<GenerationRequest | null>;
  findPending(): Promise<readonly GenerationRequest[]>;
  save(request: GenerationRequest): Promise<void>;
}
