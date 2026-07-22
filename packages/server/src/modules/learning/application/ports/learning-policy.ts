import type { LearningRecord } from '../../domain/aggregates/learning-record.js';

export interface LearningPolicy {
  canUpdateProgress(record: LearningRecord): boolean;
  shouldScheduleReview(record: LearningRecord, now: Date): boolean;
}
