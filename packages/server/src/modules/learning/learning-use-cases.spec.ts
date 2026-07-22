import { beforeEach, describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { CalculateMastery } from './application/use-cases/calculate-mastery.js';
import { CreateLearningRecord } from './application/use-cases/create-learning-record.js';
import { ScheduleReview } from './application/use-cases/schedule-review.js';
import { UpdateLearningProgress } from './application/use-cases/update-learning-progress.js';
import { StudentId } from './domain/identifiers/learning-ids.js';
import { InMemoryLearningRepository } from './infrastructure/repositories/in-memory-learning-repository.js';

const uuidService = new CryptoUuidService();

describe('Learning use cases', () => {
  let repository: InMemoryLearningRepository;
  let createRecordUseCase: CreateLearningRecord;
  let updateProgressUseCase: UpdateLearningProgress;
  let scheduleReviewUseCase: ScheduleReview;
  let calculateMasteryUseCase: CalculateMastery;

  beforeEach(() => {
    repository = new InMemoryLearningRepository();
    createRecordUseCase = new CreateLearningRecord(repository, uuidService);
    updateProgressUseCase = new UpdateLearningProgress(repository, uuidService);
    scheduleReviewUseCase = new ScheduleReview(repository, uuidService);
    calculateMasteryUseCase = new CalculateMastery(repository);
  });

  describe('CreateLearningRecord', () => {
    it('creates a learning record and saves it', async () => {
      const studentId = uuidService.generate();
      const result = await createRecordUseCase.execute({
        initialConfidence: 0.7,
        initialMastery: 0.2,
        studentId,
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const record = await repository.findById(result.value);
        expect(record).not.toBeNull();
        expect(record?.studentId.equals(StudentId.create(studentId))).toBe(true);
        expect(record?.mastery.value).toBe(0.2);
        expect(record?.confidence.value).toBe(0.7);
      }
    });

    it('returns error when invalid initial parameters provided', async () => {
      const studentId = uuidService.generate();
      const result = await createRecordUseCase.execute({
        initialMastery: 1.5,
        studentId,
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('learning.invalid-mastery-score');
      }
    });
  });

  describe('UpdateLearningProgress', () => {
    it('updates progress on existing record', async () => {
      const studentId = uuidService.generate();
      const createRes = await createRecordUseCase.execute({ studentId });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const recordId = createRes.value.toString();
      const updateRes = await updateProgressUseCase.execute({
        confidence: 0.8,
        recordId,
        responseTimeMs: 1200,
        score: 0.9,
        success: true,
      });

      expect(updateRes.isSuccess).toBe(true);
      const record = await repository.findById(createRes.value);
      expect(record?.attempts.value).toBe(1);
      expect(record?.successes.value).toBe(1);
      expect(record?.confidence.value).toBe(0.8);
      expect(record?.lastReviewedAt).not.toBeNull();
    });

    it('returns not found error if record does not exist', async () => {
      const result = await updateProgressUseCase.execute({
        recordId: uuidService.generate(),
        success: true,
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('learning.record-not-found');
      }
    });
  });

  describe('ScheduleReview', () => {
    it('schedules next review for record', async () => {
      const studentId = uuidService.generate();
      const createRes = await createRecordUseCase.execute({ studentId });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const recordId = createRes.value.toString();
      const now = new Date('2026-07-21T10:00:00.000Z');

      const scheduleRes = await scheduleReviewUseCase.execute({
        overrideIntervalDays: 3,
        recordId,
        scheduledAt: now,
      });

      expect(scheduleRes.isSuccess).toBe(true);
      if (scheduleRes.isSuccess) {
        expect(scheduleRes.value.interval.inDays).toBe(3);
        expect(scheduleRes.value.nextReviewAt).toEqual(new Date('2026-07-24T10:00:00.000Z'));
      }

      const record = await repository.findById(createRes.value);
      expect(record?.nextReviewAt).toEqual(new Date('2026-07-24T10:00:00.000Z'));
    });
  });

  describe('CalculateMastery', () => {
    it('calculates updated mastery for existing record', async () => {
      const studentId = uuidService.generate();
      const createRes = await createRecordUseCase.execute({
        initialMastery: 0.5,
        studentId,
      });
      expect(createRes.isSuccess).toBe(true);
      if (!createRes.isSuccess) return;

      const recordId = createRes.value.toString();

      const masteryRes = await calculateMasteryUseCase.execute({
        recentScore: 0.9,
        recordId,
        success: true,
      });

      expect(masteryRes.isSuccess).toBe(true);
      if (masteryRes.isSuccess) {
        // formula: 0.5 * 0.7 + 0.9 * 0.3 = 0.35 + 0.27 = 0.62
        expect(masteryRes.value.value).toBe(0.62);
      }
    });
  });
});
