import type { LearningRecord } from '../../domain/aggregates/learning-record.js';
import type { MasteryScore } from '../../domain/value-objects/mastery-score.js';

export interface MasteryCalculator {
  calculateMastery(
    record: LearningRecord,
    lastAttempt: { readonly score?: number | undefined; readonly success: boolean },
  ): MasteryScore;
}
