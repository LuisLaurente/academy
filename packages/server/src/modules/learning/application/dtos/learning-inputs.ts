export interface CreateLearningRecordInput {
  readonly difficultyAdjustment?: number;
  readonly initialConfidence?: number;
  readonly initialMastery?: number;
  readonly recordId?: string;
  readonly studentId: string;
}

export interface UpdateLearningProgressInput {
  readonly confidence?: number;
  readonly recordId: string;
  readonly responseTimeMs?: number;
  readonly reviewedAt?: Date;
  readonly score?: number;
  readonly success: boolean;
}

export interface ScheduleReviewInput {
  readonly overrideIntervalDays?: number;
  readonly recordId: string;
  readonly scheduledAt?: Date;
}

export interface CalculateMasteryInput {
  readonly recordId: string;
  readonly recentScore?: number;
  readonly success?: boolean;
}
