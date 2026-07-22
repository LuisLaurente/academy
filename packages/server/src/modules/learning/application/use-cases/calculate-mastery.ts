import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { LearningRecordNotFoundError } from '../../domain/errors/learning-errors.js';
import { LearningRecordId } from '../../domain/identifiers/learning-ids.js';
import type { MasteryScore } from '../../domain/value-objects/mastery-score.js';
import { DefaultMasteryCalculator } from '../../infrastructure/default-services.js';
import type { CalculateMasteryInput } from '../dtos/learning-inputs.ts';
import type { LearningRepository } from '../ports/learning-repository.ts';
import type { MasteryCalculator } from '../ports/mastery-calculator.ts';

export class CalculateMastery {
  constructor(
    private readonly learningRepository: LearningRepository,
    private readonly masteryCalculator: MasteryCalculator = new DefaultMasteryCalculator(),
  ) {}

  async execute(input: CalculateMasteryInput): Promise<ResultType<MasteryScore, DomainError>> {
    const recordId = LearningRecordId.create(input.recordId as Uuid);
    const record = await this.learningRepository.findById(recordId);

    if (!record) {
      return Result.failure(new LearningRecordNotFoundError(input.recordId));
    }

    const calculatedMastery = this.masteryCalculator.calculateMastery(record, {
      score: input.recentScore,
      success: input.success ?? (input.recentScore !== undefined ? input.recentScore >= 0.7 : true),
    });

    return Result.success(calculatedMastery);
  }
}
