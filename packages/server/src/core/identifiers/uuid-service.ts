import { randomUUID } from 'node:crypto';

import type { Brand } from '../types/brand.js';

const UUID_PATTERN =
  /^(?:00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export type Uuid = Brand<string, 'Uuid'>;

export interface UuidService {
  generate(): Uuid;
  isValid(candidate: string): candidate is Uuid;
}

export class CryptoUuidService implements UuidService {
  generate(): Uuid {
    return randomUUID() as Uuid;
  }

  isValid(candidate: string): candidate is Uuid {
    return UUID_PATTERN.test(candidate);
  }
}
