import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import type { StudentId } from '../../learning/domain/identifiers/learning-ids.js';
import type { SessionBuilder, SessionCandidateItem } from '../application/ports/session-builder.js';
import type { SessionPolicy } from '../application/ports/session-policy.js';
import type { SessionProgressCalculator } from '../application/ports/session-progress-calculator.js';
import type { LearningSession } from '../domain/aggregates/learning-session.js';
import { SessionItem } from '../domain/entities/session-item.js';
import { SessionStatistics } from '../domain/entities/session-statistics.js';
import { SessionItemId, SessionStatisticsId } from '../domain/identifiers/session-ids.js';
import { CompletedCount } from '../domain/value-objects/completed-count.js';
import { CompletionRate } from '../domain/value-objects/completion-rate.js';
import { SessionDuration } from '../domain/value-objects/session-duration.js';
import type { SessionProgress } from '../domain/value-objects/session-progress.js';
import { SkippedCount } from '../domain/value-objects/skipped-count.js';

const uuidService = new CryptoUuidService();

export class DefaultSessionBuilder implements SessionBuilder {
  async buildSessionItems(
    studentId: StudentId,
    candidates: readonly SessionCandidateItem[],
  ): Promise<readonly SessionItem[]> {
    void studentId;
    const items: SessionItem[] = candidates.map((c, index) =>
      SessionItem.create({
        id: SessionItemId.create(uuidService.generate()),
        itemId: c.itemId,
        itemType: c.itemType,
        order: index + 1,
      }),
    );

    return Object.freeze(items);
  }
}

export class DefaultSessionProgressCalculator implements SessionProgressCalculator {
  calculateProgress(session: LearningSession): SessionProgress {
    return session.getProgress();
  }

  calculateStatistics(session: LearningSession, now = new Date()): SessionStatistics {
    const finishedAt = session.finishedAt ?? now;
    const durationRes = SessionDuration.between(session.startedAt, finishedAt);
    const duration = durationRes.isSuccess ? durationRes.value : SessionDuration.zero();

    const rate = CompletionRate.fromCounts(session.completedExercises, session.totalExercises);

    const completedCountRes = CompletedCount.create(session.completedExercises);
    const completedCount = completedCountRes.isSuccess
      ? completedCountRes.value
      : CompletedCount.zero();

    const skippedCountRes = SkippedCount.create(session.skippedItems.length);
    const skippedCount = skippedCountRes.isSuccess ? skippedCountRes.value : SkippedCount.zero();

    const completedScores = session.completedItems
      .map((item) => item.score)
      .filter((s): s is number => s !== null && s !== undefined);

    const averageScore =
      completedScores.length > 0
        ? Number(
            (completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length).toFixed(4),
          )
        : null;

    return SessionStatistics.create({
      averageScore,
      completedCount,
      completionRate: rate,
      duration,
      id: SessionStatisticsId.create(uuidService.generate()),
      skippedCount,
    });
  }
}

export class DefaultSessionPolicy implements SessionPolicy {
  canStartSession(studentId: StudentId): boolean {
    return studentId.value.length > 0;
  }

  maxSessionItems(): number {
    return 20;
  }

  canSkipItem(session: LearningSession): boolean {
    return !session.isFinished() && session.currentItem !== null;
  }
}
