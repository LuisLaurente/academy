import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';

export interface EvaluationCoordinatorResult {
  readonly isPassed: boolean;
  readonly masteryScore: number;
  readonly score: number;
}

export interface EvaluationCoordinator {
  evaluateStudentPerformance(
    studentId: StudentId,
    exerciseId: string,
    responsePayload: string,
  ): Promise<EvaluationCoordinatorResult>;
}
