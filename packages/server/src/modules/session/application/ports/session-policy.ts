import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { LearningSession } from '../../domain/aggregates/learning-session.js';

export interface SessionPolicy {
  canSkipItem(session: LearningSession): boolean;
  canStartSession(studentId: StudentId): boolean;
  maxSessionItems(): number;
}
