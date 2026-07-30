import type { LearningSession } from '../../domain/aggregates/learning-session.js';
import type { SessionStatistics } from '../../domain/entities/session-statistics.js';
import type { SessionProgress } from '../../domain/value-objects/session-progress.js';

export interface SessionProgressCalculator {
  calculateProgress(session: LearningSession): SessionProgress;
  calculateStatistics(session: LearningSession, now?: Date): SessionStatistics;
}
