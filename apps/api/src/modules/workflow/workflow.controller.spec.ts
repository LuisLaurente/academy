import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaWorkflowRepository } from '@learning-os/server/infrastructure';
import { WorkflowController } from './workflow.controller';

const uuidService = new CryptoUuidService();

describe('WorkflowController', () => {
  const controller = new WorkflowController(new PrismaWorkflowRepository(), uuidService);

  it('starts, executes step and completes workflow', async () => {
    const studentId = uuidService.generate();
    const startRes = await controller.startWorkflow({
      curriculumItemId: 'curr-100',
      studentId,
    });

    expect(startRes.id).toBeTruthy();

    const stepRes = await controller.executeStep(startRes.id, {});
    expect(stepRes.currentStep).toBe('content_retrieval');

    const completeRes = await controller.completeWorkflow(startRes.id, {
      summary: 'Finished unit test',
    });
    expect(completeRes.status).toBe('completed');
  });
});
