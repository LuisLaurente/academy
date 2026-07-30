import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { SessionId, SessionItemId, SessionStatisticsId } from './session-ids.js';

const uuidService = new CryptoUuidService();

describe('session identifiers', () => {
  it('creates SessionId and tests equality', () => {
    const raw = uuidService.generate();
    const id1 = SessionId.create(raw);
    const id2 = SessionId.create(raw);
    const id3 = SessionId.create(uuidService.generate());

    expect(id1.value).toBe(raw);
    expect(id1.toString()).toBe(raw);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates SessionItemId and SessionStatisticsId', () => {
    const raw1 = uuidService.generate();
    const raw2 = uuidService.generate();

    const itemId = SessionItemId.create(raw1);
    const statsId = SessionStatisticsId.create(raw2);

    expect(itemId.value).toBe(raw1);
    expect(statsId.value).toBe(raw2);
  });
});
