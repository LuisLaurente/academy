import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaLearningRepository } from '@learning-os/server/infrastructure';
import { LearningController } from './learning.controller';

const uuidService = new CryptoUuidService();

describe('LearningController', () => {
  const controller = new LearningController(new PrismaLearningRepository(), uuidService);

  it('records study activity and retrieves records for student', async () => {
    const studentId = uuidService.generate();
    const record = await controller.recordActivity({
      score: 0.85,
      studentId,
      topicId: 'topic-test-1',
    });

    expect(record.id).toBeTruthy();
    expect(record.masteryScore).toBe(0.85);

    const list = await controller.getRecords(studentId);
    expect(list.length).toBe(1);
    expect(list[0]?.topicId).toBe('general-topic');
  });
});
