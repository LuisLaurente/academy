import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid, UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { WorkflowResult } from '../../domain/entities/workflow-result.js';
import { WorkflowNotFoundError } from '../../domain/errors/application-errors.js';
import { ApplicationFlowId, WorkflowResultId } from '../../domain/identifiers/application-ids.js';
import { ExecutionDuration } from '../../domain/value-objects/execution-duration.js';
import type { CompleteLearningWorkflowInput } from '../dtos/workflow-inputs.js';
import type { WorkflowRepository } from '../ports/workflow-repository.js';

export class CompleteLearningWorkflow {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly uuidService: UuidService,
  ) {}

  async execute(
    input: CompleteLearningWorkflowInput,
  ): Promise<ResultType<WorkflowResult, DomainError>> {
    const flowId = ApplicationFlowId.create(input.flowId as Uuid);
    const workflow = await this.workflowRepository.findById(flowId);

    if (!workflow) {
      return Result.failure(new WorkflowNotFoundError(input.flowId));
    }

    const completedAt = input.completedAt ?? new Date();
    const durationRes = ExecutionDuration.between(workflow.startedAt, completedAt);
    const totalDuration = durationRes.isSuccess ? durationRes.value : ExecutionDuration.zero();

    const result = WorkflowResult.create({
      completedAt,
      executedStepsCount: workflow.stepExecutions.length,
      id: WorkflowResultId.create(this.uuidService.generate()),
      summary: input.summary ?? `Workflow ${input.flowId} completed successfully`,
      totalDuration,
    });

    const completeRes = workflow.complete(result, this.uuidService.generate(), completedAt);
    if (!completeRes.isSuccess) {
      return Result.failure(completeRes.error);
    }

    await this.workflowRepository.save(workflow);

    return Result.success(result);
  }
}
