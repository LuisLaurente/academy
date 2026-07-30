import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { SessionNotFoundError } from '../../domain/errors/session-errors.js';
import { SessionId } from '../../domain/identifiers/session-ids.js';
import type { CompleteSessionItemInput } from '../dtos/session-inputs.js';
import type { SessionRepository } from '../ports/session-repository.js';

export class CompleteSessionItem {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(input: CompleteSessionItemInput): Promise<ResultType<void, DomainError>> {
    const sessionId = SessionId.create(input.sessionId as Uuid);
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return Result.failure(new SessionNotFoundError(input.sessionId));
    }

    const result = session.completeCurrentItem(
      input.score,
      this.uuidService.generate(),
      input.completedAt ?? new Date(),
    );

    if (!result.isSuccess) {
      return result;
    }

    await this.sessionRepository.save(session);

    return Result.success(undefined);
  }
}
