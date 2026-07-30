import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { CompletedCount } from './completed-count.js';
import { CompletionRate } from './completion-rate.js';
import { SkippedCount } from './skipped-count.js';

export interface CreateSessionProgressProps {
  readonly completedCount: CompletedCount;
  readonly currentItemIndex: number;
  readonly skippedCount: SkippedCount;
  readonly totalCount: number;
}

export class SessionProgress extends ValueObject {
  readonly completedCount: CompletedCount;
  readonly skippedCount: SkippedCount;
  readonly totalCount: number;
  readonly currentItemIndex: number;
  readonly completionRate: CompletionRate;

  private constructor(props: CreateSessionProgressProps) {
    super();
    this.completedCount = props.completedCount;
    this.skippedCount = props.skippedCount;
    this.totalCount = props.totalCount;
    this.currentItemIndex = props.currentItemIndex;
    this.completionRate = CompletionRate.fromCounts(props.completedCount.value, props.totalCount);
    Object.freeze(this);
  }

  static create(props: CreateSessionProgressProps): SessionProgress {
    return new SessionProgress(props);
  }

  static empty(totalCount = 0): SessionProgress {
    return new SessionProgress({
      completedCount: CompletedCount.zero(),
      currentItemIndex: 0,
      skippedCount: SkippedCount.zero(),
      totalCount,
    });
  }

  get isComplete(): boolean {
    return (
      this.totalCount > 0 && this.completedCount.value + this.skippedCount.value >= this.totalCount
    );
  }

  override toString(): string {
    return `${this.completedCount.value}/${this.totalCount} completed (${this.completionRate.toString()})`;
  }

  protected getEqualityComponents(): readonly (number | boolean)[] {
    return [
      this.completedCount.value,
      this.skippedCount.value,
      this.totalCount,
      this.currentItemIndex,
    ];
  }
}
