import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { WorkflowRepository } from '../../application/ports/workflow-repository.js';
import type { LearningWorkflow } from '../../domain/aggregates/learning-workflow.js';
import type { ApplicationFlowId } from '../../domain/identifiers/application-ids.js';

export class InMemoryWorkflowRepository implements WorkflowRepository {
  private readonly workflows = new Map<string, LearningWorkflow>();

  async findById(id: ApplicationFlowId): Promise<LearningWorkflow | null> {
    const workflow = this.workflows.get(id.toString());
    return workflow ?? null;
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningWorkflow[]> {
    const results: LearningWorkflow[] = [];
    for (const workflow of this.workflows.values()) {
      if (workflow.studentId.equals(studentId)) {
        results.push(workflow);
      }
    }
    return Object.freeze(results);
  }

  async findActiveByStudentId(studentId: StudentId): Promise<LearningWorkflow | null> {
    const studentWorkflows = await this.findByStudentId(studentId);
    const active = studentWorkflows.filter((w) => !w.workflowStatus.isTerminal);
    if (active.length === 0) {
      return null;
    }
    active.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return active[0] ?? null;
  }

  async save(workflow: LearningWorkflow): Promise<void> {
    this.workflows.set(workflow.id.toString(), workflow);
  }

  async delete(id: ApplicationFlowId): Promise<void> {
    this.workflows.delete(id.toString());
  }

  clear(): void {
    this.workflows.clear();
  }

  get count(): number {
    return this.workflows.size;
  }
}
