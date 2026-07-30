import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaRecommendationRepository } from '@learning-os/server/infrastructure';
import { describe, expect, it } from 'vitest';
import { RecommendationController } from './recommendation.controller';

const uuidService = new CryptoUuidService();

describe('RecommendationController', () => {
  const controller = new RecommendationController(
    new PrismaRecommendationRepository(),
    uuidService,
  );

  it('generates recommendations and gets active set', async () => {
    const studentId = uuidService.generate();
    const setRes = await controller.generate({ studentId });

    expect(setRes.id).toBeTruthy();
    expect(setRes.recommendedItems.length).toBeGreaterThan(0);

    const active = await controller.getActive(studentId);
    expect(active.id).toBeTruthy();
  });
});
