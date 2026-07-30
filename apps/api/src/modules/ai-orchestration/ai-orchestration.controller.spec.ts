import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaGenerationRepository } from '@learning-os/server/infrastructure';
import { AIOrchestrationController } from './ai-orchestration.controller';

const uuidService = new CryptoUuidService();

describe('AIOrchestrationController', () => {
  const controller = new AIOrchestrationController(new PrismaGenerationRepository(), uuidService);

  it('creates, starts, and completes AI generation request', async () => {
    const createRes = await controller.createRequest({
      priority: 'high',
      requestType: 'exercise_generation',
    });

    expect(createRes.id).toBeTruthy();
    expect(createRes.status).toBe('pending');

    const startRes = await controller.startRequest(createRes.id);
    expect(startRes.status).toBe('running');

    const completeRes = await controller.completeRequest(createRes.id, {
      artifactType: 'exercise_payload',
      contentPayload: '{"question": "2+2?"}',
    });

    expect(completeRes.status).toBe('completed');
  });
});
