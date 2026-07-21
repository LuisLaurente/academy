import { describe, expect, it } from 'vitest';

import { CryptoUuidService, type UuidService } from './uuid-service.js';

describe('CryptoUuidService', () => {
  const uuidService: UuidService = new CryptoUuidService();

  it('generates distinct RFC-compatible version 4 identifiers', () => {
    const firstUuid = uuidService.generate();
    const secondUuid = uuidService.generate();

    expect(firstUuid).not.toBe(secondUuid);
    expect(uuidService.isValid(firstUuid)).toBe(true);
    expect(firstUuid[14]).toBe('4');
    expect(firstUuid[19]).toMatch(/[89ab]/);
  });

  it.each([
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '01890f47-0d8a-7cc0-98d4-22f9f0b8f512',
  ])('accepts a valid UUID: %s', (candidate) => {
    expect(uuidService.isValid(candidate)).toBe(true);
  });

  it.each([
    '',
    'not-a-uuid',
    '6ba7b810-9dad-01d1-80b4-00c04fd430c8',
    '6ba7b810-9dad-11d1-70b4-00c04fd430c8',
    '6ba7b8109dad11d180b400c04fd430c8',
  ])('rejects an invalid UUID: %s', (candidate) => {
    expect(uuidService.isValid(candidate)).toBe(false);
  });
});
