import { describe, expect, it } from 'vitest';

import { Email } from './email.js';
import { HashedPassword } from './hashed-password.js';
import { PlainPassword } from './plain-password.js';

describe('Email', () => {
  it('normalizes casing and surrounding whitespace', () => {
    const result = Email.create('  Learner@Example.COM ');

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.value).toBe('learner@example.com');
      expect(result.value.toString()).toBe('learner@example.com');
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it('uses normalized value semantics', () => {
    const first = Email.create('learner@example.com');
    const second = Email.create('LEARNER@EXAMPLE.COM');

    expect(first.isSuccess && second.isSuccess && first.value.equals(second.value)).toBe(true);
  });

  it.each(['', 'not-an-email', 'a@', '@example.com', `${'a'.repeat(244)}@example.com`])(
    'rejects an invalid email without echoing it: %s',
    (candidate) => {
      const result = Email.create(candidate);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe('authentication.invalid-email');
        expect(result.error.message).toBe('The supplied email address is invalid.');
      }
    },
  );
});

describe('PlainPassword', () => {
  it('preserves the exact secret and redacts string and JSON representations', () => {
    const result = PlainPassword.create('  exact password  ', 8);

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.reveal()).toBe('  exact password  ');
      expect(result.value.toString()).toBe('[REDACTED]');
      expect(JSON.stringify(result.value)).toBe('{}');
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it.each(['short', '            '])('rejects a weak password', (candidate) => {
    const result = PlainPassword.create(candidate, 12);

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('authentication.weak-password');
      expect(result.error.context).toEqual({ minimumLength: 12 });
    }
  });

  it('rejects an invalid minimum length policy', () => {
    expect(() => PlainPassword.create('valid password', 0)).toThrow(RangeError);
  });
});

describe('HashedPassword', () => {
  it('accepts an opaque non-empty hash while keeping representations redacted', () => {
    const result = HashedPassword.create('$argon2id$opaque-hash');

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.reveal()).toBe('$argon2id$opaque-hash');
      expect(result.value.toString()).toBe('[REDACTED]');
      expect(JSON.stringify(result.value)).toBe('{}');
    }
  });

  it.each(['', '   '])('rejects an empty password hash', (candidate) => {
    const result = HashedPassword.create(candidate);

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('authentication.invalid-password-hash');
    }
  });
});
