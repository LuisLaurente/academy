import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { SessionItem } from '../entities/session-item.js';
import { SessionId, SessionItemId } from '../identifiers/session-ids.js';
import { LearningSession } from './learning-session.js';

const uuidService = new CryptoUuidService();

describe('LearningSession aggregate root', () => {
  const createTestSession = () => {
    const sessionId = SessionId.create(uuidService.generate());
    const studentId = StudentId.create(uuidService.generate());

    const item1 = SessionItem.create({
      id: SessionItemId.create(uuidService.generate()),
      itemId: 'ex-1',
      itemType: 'exercise',
      order: 1,
    });
    const item2 = SessionItem.create({
      id: SessionItemId.create(uuidService.generate()),
      itemId: 'ex-2',
      itemType: 'exercise',
      order: 2,
    });

    const session = LearningSession.start({
      eventId: uuidService.generate(),
      id: sessionId,
      items: [item1, item2],
      studentId,
    });

    return { item1, item2, session, sessionId, studentId };
  };

  it('starts session and activates first item', () => {
    const { item1, session, sessionId, studentId } = createTestSession();

    expect(session.id.equals(sessionId)).toBe(true);
    expect(session.studentId.equals(studentId)).toBe(true);
    expect(session.sessionStatus).toBe('active');
    expect(session.totalExercises).toBe(2);
    expect(session.completedExercises).toBe(0);
    expect(session.currentItem?.itemId).toBe(item1.itemId);
    expect(session.currentItem?.status).toBe('active');
    expect(session.pendingDomainEvents.length).toBe(1);
    expect(session.pendingDomainEvents[0]?.eventName).toBe('SessionStarted');
  });

  it('completes current item and advances to next item', () => {
    const { item2, session } = createTestSession();
    session.clearDomainEvents();

    const eventId = uuidService.generate();
    const result = session.completeCurrentItem(0.9, eventId);

    expect(result.isSuccess).toBe(true);
    expect(session.completedExercises).toBe(1);
    expect(session.completedItems.length).toBe(1);
    expect(session.currentItem?.itemId).toBe(item2.itemId);
    expect(session.pendingDomainEvents.length).toBe(1);
    expect(session.pendingDomainEvents[0]?.eventName).toBe('SessionItemCompleted');
  });

  it('skips current item and advances to next item', () => {
    const { item2, session } = createTestSession();
    session.clearDomainEvents();

    const eventId = uuidService.generate();
    const result = session.skipCurrentItem(eventId);

    expect(result.isSuccess).toBe(true);
    expect(session.skippedItems.length).toBe(1);
    expect(session.currentItem?.itemId).toBe(item2.itemId);
    expect(session.pendingDomainEvents.length).toBe(1);
    expect(session.pendingDomainEvents[0]?.eventName).toBe('SessionItemSkipped');
  });

  it('finishes session cleanly and clears current item', () => {
    const { session } = createTestSession();
    session.clearDomainEvents();

    const eventId = uuidService.generate();
    const result = session.finish(eventId);

    expect(result.isSuccess).toBe(true);
    expect(session.sessionStatus).toBe('finished');
    expect(session.finishedAt).not.toBeNull();
    expect(session.currentItem).toBeNull();
    expect(session.pendingDomainEvents.length).toBe(1);
    expect(session.pendingDomainEvents[0]?.eventName).toBe('SessionFinished');

    // Cannot complete items on finished session
    const reComplete = session.completeCurrentItem(0.5, eventId);
    expect(reComplete.isSuccess).toBe(false);
    if (!reComplete.isSuccess) {
      expect(reComplete.error.code).toBe('session.already-finished');
    }
  });

  it('abandons session', () => {
    const { session } = createTestSession();

    const result = session.abandon();
    expect(result.isSuccess).toBe(true);
    expect(session.sessionStatus).toBe('abandoned');
    expect(session.isFinished()).toBe(true);
  });
});
