import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { GenerationArtifact } from '../entities/generation-artifact.js';
import { GenerationMetadata } from '../entities/generation-metadata.js';
import {
  AIRequestId,
  GenerationArtifactId,
  GenerationJobId,
  GenerationMetadataId,
} from '../identifiers/ai-orchestration-ids.js';
import { GenerationAttempts } from '../value-objects/generation-attempts.js';
import { GenerationCost } from '../value-objects/generation-cost.js';
import { GenerationDuration } from '../value-objects/generation-duration.js';
import { PromptVersion } from '../value-objects/prompt-version.js';
import { GenerationRequest } from './generation-request.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('GenerationRequest aggregate root', () => {
  const createTestRequest = () => {
    const requestId = AIRequestId.create(uuidService.generate());
    const request = GenerationRequest.create({
      contentId: 'cont-1',
      curriculumItemId: 'curr-1',
      eventId: uuidService.generate(),
      id: requestId,
      requestType: 'exercise_generation',
    });

    return { request, requestId };
  };

  it('creates generation request and records requested event', () => {
    const { request, requestId } = createTestRequest();

    expect(request.id.equals(requestId)).toBe(true);
    expect(request.requestType).toBe('exercise_generation');
    expect(request.status).toBe('pending');
    expect(request.attempts.current).toBe(0);
    expect(request.pendingDomainEvents.length).toBe(1);
    expect(request.pendingDomainEvents[0]?.eventName).toBe('GenerationRequested');
  });

  it('starts generation job and increments attempt', () => {
    const { request } = createTestRequest();
    request.clearDomainEvents();

    const jobId = GenerationJobId.create(uuidService.generate());
    const startRes = request.start(jobId, uuidService.generate());

    expect(startRes.isSuccess).toBe(true);
    expect(request.status).toBe('running');
    expect(request.attempts.current).toBe(1);
    expect(request.startedAt).not.toBeNull();
    expect(request.pendingDomainEvents.length).toBe(1);
    expect(request.pendingDomainEvents[0]?.eventName).toBe('GenerationStarted');
  });

  it('completes generation request with artifact and metadata', () => {
    const { request } = createTestRequest();
    const jobId = GenerationJobId.create(uuidService.generate());
    request.start(jobId);
    request.clearDomainEvents();

    const artifact = GenerationArtifact.create({
      artifactType: 'exercise',
      contentPayload: '{"question": "2+2?"}',
      id: GenerationArtifactId.create(uuidService.generate()),
    });
    const metadata = GenerationMetadata.create({
      cost: unwrap(GenerationCost.create(100, 0.001)),
      duration: unwrap(GenerationDuration.create(500)),
      id: GenerationMetadataId.create(uuidService.generate()),
      modelName: 'gpt-4o',
      promptVersion: PromptVersion.default(),
    });

    const completeRes = request.complete(artifact, metadata, uuidService.generate());

    expect(completeRes.isSuccess).toBe(true);
    expect(request.status).toBe('completed');
    expect(request.finishedAt).not.toBeNull();
    expect(request.artifact).toBe(artifact);
    expect(request.metadata).toBe(metadata);
    expect(request.isTerminal()).toBe(true);
    expect(request.pendingDomainEvents.length).toBe(1);
    expect(request.pendingDomainEvents[0]?.eventName).toBe('GenerationCompleted');
  });

  it('fails generation request and checks retry logic', () => {
    const { request } = createTestRequest();
    const jobId = GenerationJobId.create(uuidService.generate());
    request.start(jobId);
    request.clearDomainEvents();

    const failRes = request.fail('Rate limit exceeded', uuidService.generate());

    expect(failRes.isSuccess).toBe(true);
    expect(request.status).toBe('failed');
    expect(request.finishedAt).not.toBeNull();
    expect(request.pendingDomainEvents.length).toBe(1);
    expect(request.pendingDomainEvents[0]?.eventName).toBe('GenerationFailed');
  });

  it('rejects starting when already completed or running', () => {
    const { request } = createTestRequest();
    const jobId = GenerationJobId.create(uuidService.generate());
    request.start(jobId);

    const startAgain = request.start(jobId);
    expect(startAgain.isSuccess).toBe(false);
    if (!startAgain.isSuccess) {
      expect(startAgain.error.code).toBe('ai-orchestration.already-running');
    }
  });

  it('rejects starting when max attempts exceeded', () => {
    const requestId = AIRequestId.create(uuidService.generate());
    const attempts = unwrap(GenerationAttempts.create(3, 3));
    const request = GenerationRequest.create({
      attempts,
      id: requestId,
      requestType: 'exercise_generation',
    });

    const jobId = GenerationJobId.create(uuidService.generate());
    const startRes = request.start(jobId);

    expect(startRes.isSuccess).toBe(false);
    if (!startRes.isSuccess) {
      expect(startRes.error.code).toBe('ai-orchestration.limit-exceeded');
    }
  });
});
