import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaEvaluationRepository } from '@learning-os/server/infrastructure';
import { EvaluationController } from './evaluation.controller';

describe('EvaluationController', () => {
  const controller = new EvaluationController(
    new PrismaEvaluationRepository(),
    new CryptoUuidService(),
  );

  it('submits evaluation and retrieves student evaluations', async () => {
    const evalRes = await controller.submitEvaluation({
      exerciseId: 'ex-100',
      feedback: 'Excellent work!',
      isPassed: true,
      score: 0.9,
      studentId: 'stud-eval-101',
    });

    expect(evalRes.id).toBeTruthy();
    expect(evalRes.score).toBe(0.9);

    const list = await controller.getStudentEvaluations('stud-eval-101');
    expect(list.length).toBe(1);
    expect(list[0]?.exerciseId).toBe('ex-100');
  });
});
