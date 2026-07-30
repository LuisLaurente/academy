import { describe, expect, it, vi } from 'vitest';
import { getStudentEvaluations, submitEvaluation } from './evaluation-service';
import { createExercise, getExerciseById } from './exercise-service';
import { completeSessionItem, finishSession, startSession } from './session-service';

describe('Session, Exercise, and Evaluation Services', () => {
  it('handles start, complete-item, and finish session', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        completedCount: 0,
        id: 'session-123',
        status: 'active',
        studentId: 'student-1',
      }),
      ok: true,
      status: 201,
    } as Response);

    const started = await startSession('student-1', ['item-1', 'item-2']);
    expect(started.id).toBe('session-123');

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        completedCount: 1,
        id: 'session-123',
        status: 'active',
        studentId: 'student-1',
      }),
      ok: true,
      status: 200,
    } as Response);

    const completed = await completeSessionItem('session-123', 'item-1');
    expect(completed.completedCount).toBe(1);

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        completedCount: 2,
        id: 'session-123',
        status: 'finished',
        studentId: 'student-1',
      }),
      ok: true,
      status: 200,
    } as Response);

    const finished = await finishSession('session-123');
    expect(finished.status).toBe('finished');
  });

  it('fetches and creates exercises', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        difficulty: 'easy',
        exerciseType: 'quiz',
        id: 'ex-101',
        prompt: 'What is DDD?',
        title: 'DDD Quiz',
      }),
      ok: true,
      status: 200,
    } as Response);

    const exercise = await getExerciseById('ex-101');
    expect(exercise.id).toBe('ex-101');

    const created = await createExercise(exercise);
    expect(created.title).toBe('DDD Quiz');
  });

  it('submits evaluation and fetches student evaluations', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        evaluatedAt: new Date().toISOString(),
        exerciseId: 'ex-101',
        feedback: 'Great job!',
        id: 'eval-1',
        isPassed: true,
        score: 0.95,
        studentId: 'student-1',
      }),
      ok: true,
      status: 201,
    } as Response);

    const evalRes = await submitEvaluation({
      exerciseId: 'ex-101',
      feedback: 'Great job!',
      isPassed: true,
      score: 0.95,
      studentId: 'student-1',
    });

    expect(evalRes.score).toBe(0.95);

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => [evalRes],
      ok: true,
      status: 200,
    } as Response);

    const list = await getStudentEvaluations('student-1');
    expect(list.length).toBe(1);
    expect(list[0]?.exerciseId).toBe('ex-101');
  });
});
