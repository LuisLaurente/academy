import { describe, expect, it, vi } from 'vitest';

import { DomainError } from '../../core/errors/domain-error.js';
import { CryptoUuidService, type Uuid } from '../../core/identifiers/uuid-service.js';
import { EntityId } from '../identity/entity-id.js';
import { Entity } from './entity.js';

const uuidService = new CryptoUuidService();

class TestId extends EntityId<'Test'> {
  static from(value: Uuid): TestId {
    return new TestId(value);
  }
}

class OtherId extends EntityId<'Other'> {
  static from(value: Uuid): OtherId {
    return new OtherId(value);
  }
}

class TestInvariantError extends DomainError<'test.invalid-name'> {
  constructor() {
    super({
      category: 'invariant',
      code: 'test.invalid-name',
      message: 'A test entity name must not be empty.',
    });
  }
}

class TestEntity extends Entity<TestId> {
  private currentName: string;

  constructor(
    id: TestId,
    name: string,
    errorFactory = (): DomainError => new TestInvariantError(),
  ) {
    super(id);
    this.ensureInvariant(name.trim().length > 0, errorFactory);
    this.currentName = name;
  }

  get name(): string {
    return this.currentName;
  }

  rename(name: string): void {
    this.ensureInvariant(name.trim().length > 0, () => new TestInvariantError());
    this.currentName = name;
  }
}

class DifferentEntity extends Entity<TestId> {
  constructor(id: TestId) {
    super(id);
  }
}

describe('EntityId', () => {
  it('uses value semantics within the same concrete identity type', () => {
    const value = uuidService.generate();

    expect(TestId.from(value).equals(TestId.from(value))).toBe(true);
    expect(TestId.from(value).equals(OtherId.from(value))).toBe(false);
    expect(TestId.from(value).toString()).toBe(value);
  });
});

describe('Entity', () => {
  it('compares only the same concrete entity type by identity', () => {
    const id = TestId.from(uuidService.generate());

    expect(new TestEntity(id, 'first').equals(new TestEntity(id, 'second'))).toBe(true);
    expect(new TestEntity(id, 'first').equals(new DifferentEntity(id))).toBe(false);
    expect(new TestEntity(id, 'first').equals({ id })).toBe(false);
  });

  it('does not equate entities with different identities', () => {
    expect(
      new TestEntity(TestId.from(uuidService.generate()), 'same').equals(
        new TestEntity(TestId.from(uuidService.generate()), 'same'),
      ),
    ).toBe(false);
  });

  it('enforces invariants without creating errors for valid state', () => {
    const errorFactory = vi.fn(() => new TestInvariantError());
    const entity = new TestEntity(TestId.from(uuidService.generate()), 'valid', errorFactory);

    expect(entity.name).toBe('valid');
    expect(errorFactory).not.toHaveBeenCalled();
    expect(() => entity.rename('   ')).toThrow(TestInvariantError);
    expect(entity.name).toBe('valid');
  });
});
