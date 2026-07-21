import { describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../../../../core/identifiers/uuid-service.js';
import { SessionId, UserId } from './authentication-ids.js';

const uuidService = new CryptoUuidService();

describe('authentication identifiers', () => {
  it('preserves value semantics within the same identity type', () => {
    const value = uuidService.generate();

    expect(UserId.create(value).equals(UserId.create(value))).toBe(true);
    expect(SessionId.create(value).equals(SessionId.create(value))).toBe(true);
  });

  it('does not equate user and session identities with the same UUID', () => {
    const value = uuidService.generate();

    expect(UserId.create(value).equals(SessionId.create(value))).toBe(false);
  });

  it('does not equate distinct identifiers of the same type', () => {
    expect(
      UserId.create(uuidService.generate()).equals(UserId.create(uuidService.generate())),
    ).toBe(false);
  });
});
