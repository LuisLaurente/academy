import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { LearningRecord } from '../../domain/aggregates/learning-record.js';
import { LearningRecordId, StudentId } from '../../domain/identifiers/learning-ids.js';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.js';
import { MasteryScore } from '../../domain/value-objects/mastery-score.js';
import type { CreateLearningRecordInput } from '../dtos/learning-inputs.ts';
import type { LearningRepository } from '../ports/learning-repository.ts';

export class CreateLearningRecord {
  constructor(
    private readonly learningRepository: LearningRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(
    input: CreateLearningRecordInput,
  ): Promise<ResultType<LearningRecordId, DomainError>> {
    let mastery: MasteryScore = MasteryScore.zero();
    if (input.initialMastery !== undefined) {
      const masteryResult = MasteryScore.create(input.initialMastery);
      if (!masteryResult.isSuccess) {
        return Result.failure(masteryResult.error);
      }
      mastery = masteryResult.value;
    }

    let confidence: ConfidenceScore = ConfidenceScore.default();
    if (input.initialConfidence !== undefined) {
      const confidenceResult = ConfidenceScore.create(input.initialConfidence);
      if (!confidenceResult.isSuccess) {
        return Result.failure(confidenceResult.error);
      }
      confidence = confidenceResult.value;
    }

    const recordId = LearningRecordId.create(
      input.recordId ? (input.recordId as Uuid) : this.uuidService.generate(),
    );
    const studentId = StudentId.create(input.studentId as Uuid);

    const record = LearningRecord.create({
      confidence,
      difficultyAdjustment: input.difficultyAdjustment ?? 1.0,
      eventId: this.uuidService.generate(),
      id: recordId,
      mastery,
      studentId,
    });

    await this.learningRepository.save(record);

    return Result.success(recordId);
  }
}
