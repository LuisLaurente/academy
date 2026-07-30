import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { RecommendationRepository } from '../../../recommendation/application/ports/recommendation-repository.js';
import { RecommendationSetId } from '../../../recommendation/domain/identifiers/recommendation-ids.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { LearningSession } from '../../domain/aggregates/learning-session.js';
import { SessionId } from '../../domain/identifiers/session-ids.js';
import { DefaultSessionBuilder } from '../../infrastructure/default-services.js';
import type { StartSessionInput } from '../dtos/session-inputs.js';
import type { SessionBuilder, SessionCandidateItem } from '../ports/session-builder.js';
import type { SessionRepository } from '../ports/session-repository.js';

export class StartSession {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly uuidService: UuidService,
    private readonly sessionBuilder: SessionBuilder = new DefaultSessionBuilder(),
    private readonly recommendationRepository?: RecommendationRepository,
  ) {}

  async execute(input: StartSessionInput): Promise<ResultType<SessionId, DomainError>> {
    const studentId = StudentId.create(input.studentId as Uuid);

    let candidateItems: SessionCandidateItem[] = [];

    if (input.items && input.items.length > 0) {
      candidateItems = [...input.items];
    } else if (input.recommendationSetId && this.recommendationRepository) {
      const setId = RecommendationSetId.create(input.recommendationSetId as Uuid);
      const set = await this.recommendationRepository.findById(setId);
      if (set) {
        candidateItems = set.recommendations.map((r) => ({
          itemId: r.itemId,
          itemType: r.itemType,
        }));
      }
    } else if (this.recommendationRepository) {
      const activeSet = await this.recommendationRepository.findActiveByStudentId(studentId);
      if (activeSet) {
        candidateItems = activeSet.recommendations.map((r) => ({
          itemId: r.itemId,
          itemType: r.itemType,
        }));
      }
    }

    if (candidateItems.length === 0) {
      candidateItems = [
        { itemId: 'exercise-default-1', itemType: 'exercise' },
        { itemId: 'exercise-default-2', itemType: 'exercise' },
      ];
    }

    const items = await this.sessionBuilder.buildSessionItems(studentId, candidateItems);
    const sessionId = SessionId.create(
      input.sessionId ? (input.sessionId as Uuid) : this.uuidService.generate(),
    );

    const session = LearningSession.start({
      eventId: this.uuidService.generate(),
      id: sessionId,
      items,
      studentId,
    });

    await this.sessionRepository.save(session);

    return Result.success(sessionId);
  }
}
