import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { PrismaSessionRepository } from '@learning-os/server/infrastructure';
import { SessionController } from './session.controller';

const uuidService = new CryptoUuidService();

describe('SessionController', () => {
  const controller = new SessionController(new PrismaSessionRepository(), uuidService);

  it('starts session, completes item and finishes session', async () => {
    const studentId = uuidService.generate();
    const sessionRes = await controller.startSession({
      itemIds: ['item-1', 'item-2'],
      studentId,
    });

    expect(sessionRes.id).toBeTruthy();

    const completeRes = await controller.completeItem(sessionRes.id, { itemId: 'item-1' });
    expect(completeRes.completedCount).toBe(1);

    const finishRes = await controller.finishSession(sessionRes.id);
    expect(finishRes.status).toBe('finished');
  });
});
