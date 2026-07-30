import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import type { StudentId } from '../../learning/domain/identifiers/learning-ids.js';
import { SessionId } from '../../session/domain/identifiers/session-ids.js';
import type {
  EvaluationCoordinator,
  EvaluationCoordinatorResult,
} from '../application/ports/evaluation-coordinator.js';
import type {
  GenerationCoordinator,
  GenerationCoordinatorResult,
} from '../application/ports/generation-coordinator.js';
import type { LearningFlowPolicy } from '../application/ports/learning-flow-policy.js';
import type {
  RecommendationCoordinator,
  RecommendationCoordinatorResult,
} from '../application/ports/recommendation-coordinator.js';
import type {
  SessionCoordinator,
  SessionCoordinatorResult,
} from '../application/ports/session-coordinator.js';
import type { LearningWorkflow } from '../domain/aggregates/learning-workflow.js';

const uuidService = new CryptoUuidService();

export class DefaultLearningFlowPolicy implements LearningFlowPolicy {
  canStartWorkflow(studentId: StudentId, curriculumItemId: string): boolean {
    return studentId.value.length > 0 && curriculumItemId.length > 0;
  }

  isStepExecutionAllowed(workflow: LearningWorkflow): boolean {
    return !workflow.workflowStatus.isTerminal;
  }

  maxActiveWorkflowsPerStudent(): number {
    return 3;
  }
}

export class FakeSessionCoordinator implements SessionCoordinator {
  async initializeSession(
    studentId: StudentId,
    curriculumItemId: string,
  ): Promise<SessionCoordinatorResult> {
    void studentId;
    void curriculumItemId;
    return Object.freeze({
      completedCount: 0,
      isFinished: false,
      sessionId: SessionId.create(uuidService.generate()),
    });
  }

  async completeSessionStep(
    sessionId: SessionId,
    score?: number,
  ): Promise<SessionCoordinatorResult> {
    void score;
    return Object.freeze({
      completedCount: 1,
      isFinished: true,
      sessionId,
    });
  }
}

export class FakeEvaluationCoordinator implements EvaluationCoordinator {
  async evaluateStudentPerformance(
    studentId: StudentId,
    exerciseId: string,
    responsePayload: string,
  ): Promise<EvaluationCoordinatorResult> {
    void studentId;
    void exerciseId;
    void responsePayload;
    return Object.freeze({
      isPassed: true,
      masteryScore: 0.85,
      score: 0.9,
    });
  }
}

export class FakeRecommendationCoordinator implements RecommendationCoordinator {
  async fetchNextRecommendations(
    studentId: StudentId,
    limit = 3,
  ): Promise<RecommendationCoordinatorResult> {
    void studentId;
    const itemIds = Array.from({ length: limit }, (_, i) => `rec-item-${i + 1}`);
    return Object.freeze({
      recommendedItemIds: Object.freeze(itemIds),
      setId: uuidService.generate(),
    });
  }
}

export class FakeGenerationCoordinator implements GenerationCoordinator {
  async requestContentGeneration(
    curriculumItemId: string,
    requestType: string,
  ): Promise<GenerationCoordinatorResult> {
    return Object.freeze({
      contentPayload: `Simulated content for ${curriculumItemId}`,
      requestId: uuidService.generate(),
      status: `completed_${requestType}`,
    });
  }
}
