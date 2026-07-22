import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { LearningRecordNotFoundError } from '../../domain/errors/learning-errors.js';
import { LearningRecordId } from '../../domain/identifiers/learning-ids.js';
import { ReviewInterval } from '../../domain/value-objects/review-interval.js';
import { DefaultReviewScheduler } from '../../infrastructure/default-services.js';
import type { ScheduleReviewInput } from '../dtos/learning-inputs.ts';
import type { LearningRepository } from '../ports/learning-repository.ts';
import type { ReviewScheduler, ScheduledReviewResult } from '../ports/review-scheduler.ts';

export class ScheduleReview {
  constructor(
    private readonly learningRepository: LearningRepository,
    private readonly uuidService: UuidService,
    private readonly reviewScheduler: ReviewScheduler = new DefaultReviewScheduler(),
  ) {}

  async execute(
    input: ScheduleReviewInput,
  ): Promise<ResultType<ScheduledReviewResult, DomainError>> {
    const recordId = LearningRecordId.create(input.recordId as Uuid);
    const record = await this.learningRepository.findById(recordId);

    if (!record) {
      return Result.failure(new LearningRecordNotFoundError(input.recordId));
    }

    const scheduledAt = input.scheduledAt ?? new Date();

    let scheduled: ScheduledReviewResult;
    if (input.overrideIntervalDays !== undefined) {
      const intervalRes = ReviewInterval.fromDays(input.overrideIntervalDays);
      if (!intervalRes.isSuccess) {
        return Result.failure(intervalRes.error);
      }
      const interval = intervalRes.value;
      const nextReviewAt = new Date(scheduledAt.getTime() + interval.inMilliseconds);
      scheduled = { interval, nextReviewAt };
    } else {
      const lastSuccess = record.metrics.lastAttemptSuccess ?? true;
      scheduled = this.reviewScheduler.calculateNextReview(
        record,
        { success: lastSuccess },
        scheduledAt,
      );
    }

    const scheduleRes = record.scheduleReview(
      {
        interval: scheduled.interval,
        nextReviewAt: scheduled.nextReviewAt,
      },
      {
        eventId: this.uuidService.generate(),
        occurredAt: scheduledAt,
      },
    );

    if (!scheduleRes.isSuccess) {
      return Result.failure(scheduleRes.error);
    }

    await this.learningRepository.save(record);

    return Result.success(scheduled);
  }
}
