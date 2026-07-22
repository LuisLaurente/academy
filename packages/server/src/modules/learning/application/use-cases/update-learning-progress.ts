import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { LearningRecordNotFoundError } from '../../domain/errors/learning-errors.js';
import { LearningRecordId } from '../../domain/identifiers/learning-ids.js';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.js';
import {
  DefaultMasteryCalculator,
  DefaultRetentionCalculator,
} from '../../infrastructure/default-services.js';
import type { UpdateLearningProgressInput } from '../dtos/learning-inputs.ts';
import type { LearningRepository } from '../ports/learning-repository.ts';
import type { MasteryCalculator } from '../ports/mastery-calculator.ts';
import type { RetentionCalculator } from '../ports/retention-calculator.ts';

export class UpdateLearningProgress {
  constructor(
    private readonly learningRepository: LearningRepository,
    private readonly uuidService: UuidService,
    private readonly masteryCalculator: MasteryCalculator = new DefaultMasteryCalculator(),
    private readonly retentionCalculator: RetentionCalculator = new DefaultRetentionCalculator(),
  ) {}

  async execute(input: UpdateLearningProgressInput): Promise<ResultType<void, DomainError>> {
    const recordId = LearningRecordId.create(input.recordId as Uuid);
    const record = await this.learningRepository.findById(recordId);

    if (!record) {
      return Result.failure(new LearningRecordNotFoundError(input.recordId));
    }

    let confidence: ConfidenceScore | undefined;
    if (input.confidence !== undefined) {
      const confRes = ConfidenceScore.create(input.confidence);
      if (!confRes.isSuccess) {
        return Result.failure(confRes.error);
      }
      confidence = confRes.value;
    }

    const reviewedAt = input.reviewedAt ?? new Date();

    const newMastery = this.masteryCalculator.calculateMastery(record, {
      score: input.score,
      success: input.success,
    });

    const newRetention = this.retentionCalculator.calculateRetention(record, reviewedAt);

    const updateRes = record.updateProgress(
      {
        confidence,
        mastery: newMastery,
        responseTimeMs: input.responseTimeMs,
        retention: newRetention,
        reviewedAt,
        score: input.score ?? (input.success ? 1.0 : 0.0),
        success: input.success,
      },
      {
        eventId: this.uuidService.generate(),
        occurredAt: reviewedAt,
      },
    );

    if (!updateRes.isSuccess) {
      return updateRes;
    }

    await this.learningRepository.save(record);

    return Result.success(undefined);
  }
}
