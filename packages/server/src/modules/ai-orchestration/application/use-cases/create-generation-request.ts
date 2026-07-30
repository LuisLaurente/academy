import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { GenerationRequest } from '../../domain/aggregates/generation-request.js';
import { AIRequestId } from '../../domain/identifiers/ai-orchestration-ids.js';
import { GenerationPriority } from '../../domain/value-objects/generation-priority.js';
import type { CreateGenerationRequestInput } from '../dtos/ai-orchestration-inputs.js';
import type { GenerationRepository } from '../ports/generation-repository.js';

export class CreateGenerationRequest {
  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(
    input: CreateGenerationRequestInput,
  ): Promise<ResultType<AIRequestId, DomainError>> {
    const priorityRes = input.priority
      ? GenerationPriority.create(input.priority)
      : Result.success(GenerationPriority.medium());

    if (!priorityRes.isSuccess) {
      return Result.failure(priorityRes.error);
    }

    const requestId = AIRequestId.create(
      input.requestId ? (input.requestId as Uuid) : this.uuidService.generate(),
    );

    const request = GenerationRequest.create({
      contentId: input.contentId ?? null,
      curriculumItemId: input.curriculumItemId ?? null,
      eventId: this.uuidService.generate(),
      id: requestId,
      priority: priorityRes.value,
      requestType: input.requestType,
    });

    await this.generationRepository.save(request);

    return Result.success(requestId);
  }
}
