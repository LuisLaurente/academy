import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { SessionStatistics } from '../../domain/entities/session-statistics.js';
import { SessionNotFoundError } from '../../domain/errors/session-errors.js';
import { SessionId } from '../../domain/identifiers/session-ids.js';
import { DefaultSessionProgressCalculator } from '../../infrastructure/default-services.js';
import type { FinishSessionInput } from '../dtos/session-inputs.js';
import type { SessionProgressCalculator } from '../ports/session-progress-calculator.js';
import type { SessionRepository } from '../ports/session-repository.js';

export class FinishSession {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly uuidService: UuidService,
    private readonly progressCalculator: SessionProgressCalculator = new DefaultSessionProgressCalculator(),
  ) {}

  async execute(input: FinishSessionInput): Promise<ResultType<SessionStatistics, DomainError>> {
    const sessionId = SessionId.create(input.sessionId as Uuid);
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return Result.failure(new SessionNotFoundError(input.sessionId));
    }

    const finishDate = input.finishedAt ?? new Date();
    const finishRes = session.finish(this.uuidService.generate(), finishDate);

    if (!finishRes.isSuccess) {
      return Result.failure(finishRes.error);
    }

    await this.sessionRepository.save(session);

    const stats = this.progressCalculator.calculateStatistics(session, finishDate);

    return Result.success(stats);
  }
}
