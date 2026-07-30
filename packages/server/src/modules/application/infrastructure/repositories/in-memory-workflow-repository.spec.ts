import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { LearningWorkflow } from '../../domain/aggregates/learning-workflow.js';
import { WorkflowResult } from '../../domain/entities/workflow-result.js';
import { ApplicationFlowId, WorkflowResultId } from '../../domain/identifiers/application-ids.js';
import { ExecutionDuration } from '../../domain/value-objects/execution-duration.js';
import { InMemoryWorkflowRepository } from './in-memory-workflow-repository.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('InMemoryWorkflowRepository', () => {
  it('saves, retrieves, finds active workflows, and deletes', async () => {
    const repo = new InMemoryWorkflowRepository();
    const student1 = StudentId.create(uuidService.generate());
    const student2 = StudentId.create(uuidService.generate());

    const activeWorkflow = LearningWorkflow.start({
      curriculumItemId: 'curr-1',
      id: ApplicationFlowId.create(uuidService.generate()),
      studentId: student1,
    });

    const completedWorkflow = LearningWorkflow.start({
      curriculumItemId: 'curr-2',
      id: ApplicationFlowId.create(uuidService.generate()),
      studentId: student1,
    });
    completedWorkflow.complete(
      WorkflowResult.create({
        completedAt: new Date(),
        executedStepsCount: 8,
        id: WorkflowResultId.create(uuidService.generate()),
        summary: 'Done',
        totalDuration: unwrap(ExecutionDuration.create(1000)),
      }),
    );

    const student2Workflow = LearningWorkflow.start({
      curriculumItemId: 'curr-3',
      id: ApplicationFlowId.create(uuidService.generate()),
      studentId: student2,
    });

    await repo.save(activeWorkflow);
    await repo.save(completedWorkflow);
    await repo.save(student2Workflow);

    expect(repo.count).toBe(3);

    const foundActive = await repo.findActiveByStudentId(student1);
    expect(foundActive).not.toBeNull();
    expect(foundActive?.id.equals(activeWorkflow.id)).toBe(true);

    const allStudent1 = await repo.findByStudentId(student1);
    expect(allStudent1.length).toBe(2);

    await repo.delete(activeWorkflow.id);
    expect(repo.count).toBe(2);

    repo.clear();
    expect(repo.count).toBe(0);
  });
});
