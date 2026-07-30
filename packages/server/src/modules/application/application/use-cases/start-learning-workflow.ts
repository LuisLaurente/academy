import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { LearningWorkflow } from '../../domain/aggregates/learning-workflow.js';
import { ApplicationFlowId } from '../../domain/identifiers/application-ids.js';
import { FakeSessionCoordinator } from '../../infrastructure/default-coordinators.js';
import type { StartLearningWorkflowInput } from '../dtos/workflow-inputs.js';
import type { SessionCoordinator } from '../ports/session-coordinator.js';
import type { WorkflowRepository } from '../ports/workflow-repository.js';

export class StartLearningWorkflow {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly uuidService: UuidService,
    private readonly sessionCoordinator: SessionCoordinator = new FakeSessionCoordinator(),
  ) {}

  async execute(
    input: StartLearningWorkflowInput,
  ): Promise<ResultType<ApplicationFlowId, DomainError>> {
    const studentId = StudentId.create(input.studentId as Uuid);
    const flowId = ApplicationFlowId.create(
      input.flowId ? (input.flowId as Uuid) : this.uuidService.generate(),
    );

    const sessionInit = await this.sessionCoordinator.initializeSession(
      studentId,
      input.curriculumItemId,
    );

    const workflow = LearningWorkflow.start({
      curriculumItemId: input.curriculumItemId,
      eventId: this.uuidService.generate(),
      id: flowId,
      sessionId: sessionInit.sessionId,
      studentId,
    });

    await this.workflowRepository.save(workflow);

    return Result.success(flowId);
  }
}
