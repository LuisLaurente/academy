import { beforeEach, describe, expect, it } from 'vitest';
import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { StudentId } from '../learning/domain/identifiers/learning-ids.js';
import { CompleteSessionItem } from './application/use-cases/complete-session-item.js';
import { FinishSession } from './application/use-cases/finish-session.js';
import { SkipSessionItem } from './application/use-cases/skip-session-item.js';
import { StartSession } from './application/use-cases/start-session.js';
import { InMemorySessionRepository } from './infrastructure/repositories/in-memory-session-repository.js';

const uuidService = new CryptoUuidService();

describe('Session use cases', () => {
  let repository: InMemorySessionRepository;
  let startUseCase: StartSession;
  let completeUseCase: CompleteSessionItem;
  let skipUseCase: SkipSessionItem;
  let finishUseCase: FinishSession;

  beforeEach(() => {
    repository = new InMemorySessionRepository();
    startUseCase = new StartSession(repository, uuidService);
    completeUseCase = new CompleteSessionItem(repository, uuidService);
    skipUseCase = new SkipSessionItem(repository, uuidService);
    finishUseCase = new FinishSession(repository, uuidService);
  });

  describe('StartSession', () => {
    it('starts a new study session with default items', async () => {
      const studentId = uuidService.generate();
      const result = await startUseCase.execute({ studentId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const session = await repository.findById(result.value);
        expect(session).not.toBeNull();
        expect(session?.studentId.equals(StudentId.create(studentId as Uuid))).toBe(true);
        expect(session?.totalExercises).toBe(2);
        expect(session?.sessionStatus).toBe('active');
      }
    });
  });

  describe('CompleteSessionItem', () => {
    it('completes current item in session', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({ studentId });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const sessionId = startRes.value.toString();
      const completeRes = await completeUseCase.execute({
        score: 0.85,
        sessionId,
      });

      expect(completeRes.isSuccess).toBe(true);

      const session = await repository.findById(startRes.value);
      expect(session?.completedExercises).toBe(1);
    });

    it('returns error when session is not found', async () => {
      const result = await completeUseCase.execute({
        sessionId: uuidService.generate(),
      });
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('session.not-found');
      }
    });
  });

  describe('SkipSessionItem', () => {
    it('skips current item in session', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({ studentId });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const sessionId = startRes.value.toString();
      const skipRes = await skipUseCase.execute({ sessionId });

      expect(skipRes.isSuccess).toBe(true);

      const session = await repository.findById(startRes.value);
      expect(session?.skippedItems.length).toBe(1);
    });
  });

  describe('FinishSession', () => {
    it('finishes session and returns statistics', async () => {
      const studentId = uuidService.generate();
      const startRes = await startUseCase.execute({ studentId });
      expect(startRes.isSuccess).toBe(true);
      if (!startRes.isSuccess) return;

      const sessionId = startRes.value.toString();
      await completeUseCase.execute({ score: 0.9, sessionId });

      const finishRes = await finishUseCase.execute({ sessionId });
      expect(finishRes.isSuccess).toBe(true);

      if (finishRes.isSuccess) {
        expect(finishRes.value.completedCount.value).toBe(1);
        expect(finishRes.value.averageScore).toBe(0.9);
      }

      const session = await repository.findById(startRes.value);
      expect(session?.sessionStatus).toBe('finished');
    });
  });
});
