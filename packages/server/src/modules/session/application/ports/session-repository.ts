import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { LearningSession } from '../../domain/aggregates/learning-session.js';
import type { SessionId } from '../../domain/identifiers/session-ids.js';

export interface SessionRepository {
  delete(id: SessionId): Promise<void>;
  findActiveByStudentId(studentId: StudentId): Promise<LearningSession | null>;
  findById(id: SessionId): Promise<LearningSession | null>;
  findByStudentId(studentId: StudentId): Promise<readonly LearningSession[]>;
  save(session: LearningSession): Promise<void>;
}
