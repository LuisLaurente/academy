import { Entity } from '../../../../domain/entities/entity.js';
import type { SessionStatisticsId } from '../identifiers/session-ids.js';
import type { CompletedCount } from '../value-objects/completed-count.js';
import type { CompletionRate } from '../value-objects/completion-rate.js';
import type { SessionDuration } from '../value-objects/session-duration.js';
import type { SkippedCount } from '../value-objects/skipped-count.js';

export interface CreateSessionStatisticsProps {
  readonly averageScore?: number | null;
  readonly completedCount: CompletedCount;
  readonly completionRate: CompletionRate;
  readonly duration: SessionDuration;
  readonly id: SessionStatisticsId;
  readonly skippedCount: SkippedCount;
}

export class SessionStatistics extends Entity<SessionStatisticsId> {
  readonly duration: SessionDuration;
  readonly completionRate: CompletionRate;
  readonly completedCount: CompletedCount;
  readonly skippedCount: SkippedCount;
  readonly averageScore: number | null;

  private constructor(props: CreateSessionStatisticsProps) {
    super(props.id);
    this.duration = props.duration;
    this.completionRate = props.completionRate;
    this.completedCount = props.completedCount;
    this.skippedCount = props.skippedCount;
    this.averageScore = props.averageScore ?? null;
    Object.freeze(this);
  }

  static create(props: CreateSessionStatisticsProps): SessionStatistics {
    return new SessionStatistics(props);
  }
}
