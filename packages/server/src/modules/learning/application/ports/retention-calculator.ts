import type { LearningRecord } from '../../domain/aggregates/learning-record.js';
import type { RetentionScore } from '../../domain/value-objects/retention-score.js';

export interface RetentionCalculator {
  calculateRetention(record: LearningRecord, now: Date): RetentionScore;
}
