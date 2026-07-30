import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { WorkflowNotFoundError } from '../../domain/errors/application-errors.js';
import { ApplicationFlowId } from '../../domain/identifiers/application-ids.js';
import type { FailLearningWorkflowInput } from '../dtos/workflow-inputs.js';
import type { WorkflowRepository } from '../ports/workflow-repository.js';

export class FailLearningWorkflow {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(input: FailLearningWorkflowInput): Promise<ResultType<void, DomainError>> {
    const flowId = ApplicationFlowId.create(input.flowId as Uuid);
    const workflow = await this.workflowRepository.findById(flowId);

    if (!workflow) {
      return Result.failure(new WorkflowNotFoundError(input.flowId));
    }

    const failRes = workflow.fail(input.reason, this.uuidService.generate());
    if (!failRes.isSuccess) {
      return failRes;
    }

    await this.workflowRepository.save(workflow);

    return Result.success(undefined);
  }
}
