import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionId } from '../../../session/domain/identifiers/session-ids.js';

export interface SessionCoordinatorResult {
  readonly completedCount: number;
  readonly isFinished: boolean;
  readonly sessionId: SessionId;
}

export interface SessionCoordinator {
  completeSessionStep(sessionId: SessionId, score?: number): Promise<SessionCoordinatorResult>;
  initializeSession(
    studentId: StudentId,
    curriculumItemId: string,
  ): Promise<SessionCoordinatorResult>;
}
