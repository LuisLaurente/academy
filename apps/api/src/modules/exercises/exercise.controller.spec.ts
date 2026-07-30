import { describe, expect, it } from 'vitest';
import { PrismaExerciseRepository } from '@learning-os/server/infrastructure';
import { ExerciseController } from './exercise.controller';

describe('ExerciseController', () => {
  const controller = new ExerciseController(new PrismaExerciseRepository());

  it('creates and retrieves exercise by id', async () => {
    const created = await controller.createExercise({
      difficulty: 'easy',
      exerciseType: 'quiz',
      id: 'ex-spec-1',
      prompt: 'Sample prompt',
      title: 'Sample Title',
    });

    expect(created.id).toBe('ex-spec-1');

    const found = await controller.getExerciseById('ex-spec-1');
    expect(found.title).toBe('Sample Title');
  });
});
