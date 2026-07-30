import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { WorkflowStepExecution } from '../../domain/entities/workflow-step-execution.js';
import { WorkflowNotFoundError } from '../../domain/errors/application-errors.js';
import {
  ApplicationFlowId,
  WorkflowExecutionId,
} from '../../domain/identifiers/application-ids.js';
import {
  FakeEvaluationCoordinator,
  FakeGenerationCoordinator,
  FakeRecommendationCoordinator,
  FakeSessionCoordinator,
} from '../../infrastructure/default-coordinators.js';
import type { ExecuteLearningStepInput } from '../dtos/workflow-inputs.js';
import type { EvaluationCoordinator } from '../ports/evaluation-coordinator.js';
import type { GenerationCoordinator } from '../ports/generation-coordinator.js';
import type { RecommendationCoordinator } from '../ports/recommendation-coordinator.js';
import type { SessionCoordinator } from '../ports/session-coordinator.js';
import type { WorkflowRepository } from '../ports/workflow-repository.js';

export class ExecuteLearningStep {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly uuidService: UuidService,
    private readonly sessionCoordinator: SessionCoordinator = new FakeSessionCoordinator(),
    private readonly evaluationCoordinator: EvaluationCoordinator = new FakeEvaluationCoordinator(),
    private readonly recommendationCoordinator: RecommendationCoordinator = new FakeRecommendationCoordinator(),
    private readonly generationCoordinator: GenerationCoordinator = new FakeGenerationCoordinator(),
  ) {}

  async execute(input: ExecuteLearningStepInput): Promise<ResultType<string, DomainError>> {
    const flowId = ApplicationFlowId.create(input.flowId as Uuid);
    const workflow = await this.workflowRepository.findById(flowId);

    if (!workflow) {
      return Result.failure(new WorkflowNotFoundError(input.flowId));
    }

    const currentStep = workflow.currentStep;
    const execution = WorkflowStepExecution.create({
      id: WorkflowExecutionId.create(this.uuidService.generate()),
      step: currentStep,
    });

    let stepSummary = `Executed step ${currentStep.name}`;

    switch (currentStep.name) {
      case 'session_execution':
        if (workflow.sessionId) {
          const sessionRes = await this.sessionCoordinator.completeSessionStep(
            workflow.sessionId,
            input.payload?.score,
          );
          stepSummary = `Session step executed (${sessionRes.completedCount} items completed)`;
        }
        break;
      case 'evaluation_processing':
        if (input.payload?.exerciseId && input.payload.responsePayload) {
          const evalRes = await this.evaluationCoordinator.evaluateStudentPerformance(
            workflow.studentId,
            input.payload.exerciseId,
            input.payload.responsePayload,
          );
          stepSummary = `Evaluation completed (score: ${evalRes.score})`;
        }
        break;
      case 'recommendation_generation':
        {
          const recRes = await this.recommendationCoordinator.fetchNextRecommendations(
            workflow.studentId,
          );
          stepSummary = `Fetched ${recRes.recommendedItemIds.length} recommendations`;
        }
        break;
      case 'ai_orchestration_sync':
        {
          const genRes = await this.generationCoordinator.requestContentGeneration(
            workflow.curriculumItemId,
            'exercise_generation',
          );
          stepSummary = `AI Orchestration request created (${genRes.requestId})`;
        }
        break;
      default:
        break;
    }

    const execResult = workflow.executeStep(execution, this.uuidService.generate());
    if (!execResult.isSuccess) {
      return execResult;
    }

    await this.workflowRepository.save(workflow);

    return Result.success(stepSummary);
  }
}
