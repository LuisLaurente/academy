import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { GenerationRequestNotFoundError } from '../../domain/errors/ai-orchestration-errors.js';
import { AIRequestId } from '../../domain/identifiers/ai-orchestration-ids.js';
import type { FailGenerationInput } from '../dtos/ai-orchestration-inputs.js';
import type { GenerationRepository } from '../ports/generation-repository.js';

export class FailGeneration {
  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(input: FailGenerationInput): Promise<ResultType<void, DomainError>> {
    const requestId = AIRequestId.create(input.requestId as Uuid);
    const request = await this.generationRepository.findById(requestId);

    if (!request) {
      return Result.failure(new GenerationRequestNotFoundError(input.requestId));
    }

    const failRes = request.fail(input.reason, this.uuidService.generate());
    if (!failRes.isSuccess) {
      return failRes;
    }

    await this.generationRepository.save(request);

    return Result.success(undefined);
  }
}
