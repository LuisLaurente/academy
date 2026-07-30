import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { GenerationRequestNotFoundError } from '../../domain/errors/ai-orchestration-errors.js';
import { AIRequestId, GenerationJobId } from '../../domain/identifiers/ai-orchestration-ids.js';
import type { StartGenerationInput } from '../dtos/ai-orchestration-inputs.js';
import type { GenerationRepository } from '../ports/generation-repository.js';

export class StartGeneration {
  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(input: StartGenerationInput): Promise<ResultType<void, DomainError>> {
    const requestId = AIRequestId.create(input.requestId as Uuid);
    const request = await this.generationRepository.findById(requestId);

    if (!request) {
      return Result.failure(new GenerationRequestNotFoundError(input.requestId));
    }

    const jobId = GenerationJobId.create(
      input.jobId ? (input.jobId as Uuid) : this.uuidService.generate(),
    );

    const startRes = request.start(jobId, this.uuidService.generate());
    if (!startRes.isSuccess) {
      return startRes;
    }

    await this.generationRepository.save(request);

    return Result.success(undefined);
  }
}
