import { beforeEach, describe, expect, it } from 'vitest';
import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { StudentId } from '../learning/domain/identifiers/learning-ids.js';
import { CompleteLearningWorkflow } from './application/use-cases/complete-learning-workflow.js';
import { ExecuteLearningStep } from './application/use-cases/execute-learning-step.js';
import { FailLearningWorkflow } from './application/use-cases/fail-learning-workflow.js';
import { StartLearningWorkflow } from './application/use-cases/start-learning-workflow.js';
import {
  FakeEvaluationCoordinator,
  FakeGenerationCoordinator,
  FakeRecommendationCoordinator,
  FakeSessionCoordinator,
} from './infrastructure/default-coordinators.js';
import { InMemoryWorkflowRepository } from './infrastructure/repositories/in-memory-workflow-repository.js';

const uuidService = new CryptoUuidService();

describe('Application Workflow use cases', () => {
  let repository: InMemoryWorkflowRepository;
  let sessionCoordinator: FakeSessionCoordinator;
  let evaluationCoordinator: FakeEvaluationCoordinator;
  let recommendationCoordinator: FakeRecommendationCoordinator;
  let generationCoordinator: FakeGenerationCoordinator;
  let startUseCase: StartLearningWorkflow;
  let executeStepUseCase: ExecuteLearningStep;
  let completeUseCase: CompleteLearningWorkflow;
  let failUseCase: FailLearningWorkflow;

  beforeEach(() => {
    repository = new InMemoryWorkflowRepository();
    sessionCoordinator = new FakeSessionCoordinator();
    evaluationCoordinator = new FakeEvaluationCoordinator();
    recommendationCoordinator = new FakeRecommendationCoordinator();
    generationCoordinator = new FakeGenerationCoordinator();

    startUseCase = new StartLearningWorkflow(repository, uuidService, sessionCoordinator);
    executeStepUseCase = new ExecuteLearningStep(
      repository,
      uuidService,
      sessionCoordinator,
      evaluationCoordinator,
      recommendationCoordinator,
      generationCoordinator,
    );
    completeUseCase = new CompleteLearningWorkflow(repository, uuidService);
    failUseCase = new FailLearningWorkflow(repository, uuidService);
  });

  describe('StartLearningWorkflow', () => {
    it('starts a new learning workflow and attaches initialized session', async () => {
      const studentId = uuidService.generate();
      const result = await startUseCase.execute({
        curriculumItemId: 'curr-topic-101',
        studentId,
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const workflow = await repository.findById(result.value);
        expect(workflow).not.toBeNull();
        expect(workflow?.studentId.equals(StudentId.create(studentId as Uuid))).toBe(true);
        expect(workflow?.curriculumItemId).toBe('curr-topic-101');
        expect(workflow?.sessionId).not.toBeNull();
        expect(workflow?.workflowStatus.state).toBe('running');
      }
    });
  });

  describe('ExecuteLearningStep', () => {
    it('executes learning step and advances current step in sequence', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({
        curriculumItemId: 'curr-topic-102',
        studentId,
      });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const flowId = startRes.value.toString();
      const stepRes = await executeStepUseCase.execute({ flowId });

      expect(stepRes.isSuccess).toBe(true);

      const workflow = await repository.findById(startRes.value);
      expect(workflow?.stepExecutions.length).toBe(1);
      expect(workflow?.currentStep.name).toBe('content_retrieval');
    });

    it('returns error if workflow is not found', async () => {
      const result = await executeStepUseCase.execute({
        flowId: uuidService.generate(),
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('application-workflow.not-found');
      }
    });
  });

  describe('CompleteLearningWorkflow', () => {
    it('completes workflow and returns workflow result', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({
        curriculumItemId: 'curr-topic-103',
        studentId,
      });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const flowId = startRes.value.toString();
      await executeStepUseCase.execute({ flowId });

      const completeRes = await completeUseCase.execute({
        flowId,
        summary: 'Finished learning unit',
      });

      expect(completeRes.isSuccess).toBe(true);
      if (completeRes.isSuccess) {
        expect(completeRes.value.summary).toBe('Finished learning unit');
        expect(completeRes.value.executedStepsCount).toBe(1);
      }

      const workflow = await repository.findById(startRes.value);
      expect(workflow?.workflowStatus.state).toBe('completed');
    });
  });

  describe('FailLearningWorkflow', () => {
    it('marks workflow as failed', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({
        curriculumItemId: 'curr-topic-104',
        studentId,
      });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const flowId = startRes.value.toString();
      const failRes = await failUseCase.execute({
        flowId,
        reason: 'Curriculum step timeout',
      });

      expect(failRes.isSuccess).toBe(true);

      const workflow = await repository.findById(startRes.value);
      expect(workflow?.workflowStatus.state).toBe('failed');
    });
  });
});
