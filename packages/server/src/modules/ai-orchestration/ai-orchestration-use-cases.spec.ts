import { beforeEach, describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { CompleteGeneration } from './application/use-cases/complete-generation.js';
import { CreateGenerationRequest } from './application/use-cases/create-generation-request.js';
import { FailGeneration } from './application/use-cases/fail-generation.js';
import { StartGeneration } from './application/use-cases/start-generation.js';
import { InMemoryGenerationResultStore } from './infrastructure/default-services.js';
import { InMemoryGenerationRepository } from './infrastructure/repositories/in-memory-generation-repository.js';

const uuidService = new CryptoUuidService();

describe('AI Orchestration use cases', () => {
  let repository: InMemoryGenerationRepository;
  let resultStore: InMemoryGenerationResultStore;
  let createUseCase: CreateGenerationRequest;
  let startUseCase: StartGeneration;
  let completeUseCase: CompleteGeneration;
  let failUseCase: FailGeneration;

  beforeEach(() => {
    repository = new InMemoryGenerationRepository();
    resultStore = new InMemoryGenerationResultStore();
    createUseCase = new CreateGenerationRequest(repository, uuidService);
    startUseCase = new StartGeneration(repository, uuidService);
    completeUseCase = new CompleteGeneration(repository, uuidService, resultStore);
    failUseCase = new FailGeneration(repository, uuidService);
  });

  describe('CreateGenerationRequest', () => {
    it('creates and saves a new generation request', async () => {
      const result = await createUseCase.execute({
        contentId: 'cont-100',
        curriculumItemId: 'curr-200',
        priority: 'high',
        requestType: 'exercise_generation',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const req = await repository.findById(result.value);
        expect(req).not.toBeNull();
        expect(req?.requestType).toBe('exercise_generation');
        expect(req?.priority.level).toBe('high');
        expect(req?.status).toBe('pending');
      }
    });

    it('returns error on invalid priority', async () => {
      const result = await createUseCase.execute({
        priority: 'invalid-priority',
        requestType: 'exercise_generation',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('ai-orchestration.invalid-value');
      }
    });
  });

  describe('StartGeneration', () => {
    it('starts a pending generation request', async () => {
      const createRes = await createUseCase.execute({
        requestType: 'content_generation',
      });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const requestId = createRes.value.toString();
      const startRes = await startUseCase.execute({ requestId });

      expect(startRes.isSuccess).toBe(true);

      const req = await repository.findById(createRes.value);
      expect(req?.status).toBe('running');
    });

    it('returns error if request is not found', async () => {
      const result = await startUseCase.execute({
        requestId: uuidService.generate(),
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('ai-orchestration.request-not-found');
      }
    });
  });

  describe('CompleteGeneration', () => {
    it('completes running request and stores result in resultStore', async () => {
      const createRes = await createUseCase.execute({
        requestType: 'exercise_generation',
      });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const requestId = createRes.value.toString();
      await startUseCase.execute({ requestId });

      const completeRes = await completeUseCase.execute({
        artifactType: 'exercise_payload',
        contentPayload: '{"question": "What is DDD?"}',
        durationMs: 1500,
        estimatedCostUSD: 0.002,
        modelName: 'claude-3-5-sonnet',
        requestId,
        tokensUsed: 400,
      });

      expect(completeRes.isSuccess).toBe(true);

      const req = await repository.findById(createRes.value);
      expect(req?.status).toBe('completed');

      const storedResult = await resultStore.getResult(createRes.value);
      expect(storedResult).not.toBeNull();
      expect(storedResult?.artifact.contentPayload).toBe('{"question": "What is DDD?"}');
      expect(storedResult?.metadata.modelName).toBe('claude-3-5-sonnet');
    });
  });

  describe('FailGeneration', () => {
    it('marks request as failed', async () => {
      const createRes = await createUseCase.execute({
        requestType: 'explanation_generation',
      });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const requestId = createRes.value.toString();
      await startUseCase.execute({ requestId });

      const failRes = await failUseCase.execute({
        reason: 'Service Unavailable',
        requestId,
      });

      expect(failRes.isSuccess).toBe(true);

      const req = await repository.findById(createRes.value);
      expect(req?.status).toBe('failed');
    });
  });
});
