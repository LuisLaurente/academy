import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionItem } from '../../domain/entities/session-item.js';

export interface SessionCandidateItem {
  readonly itemId: string;
  readonly itemType: string;
}

export interface SessionBuilder {
  buildSessionItems(
    studentId: StudentId,
    candidates: readonly SessionCandidateItem[],
  ): Promise<readonly SessionItem[]>;
}
