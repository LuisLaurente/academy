import { describe, expect, it } from 'vitest';

import { assertNever } from './assert-never.js';

describe('assertNever', () => {
  it('fails loudly when an unreachable runtime value is received', () => {
    expect(() => Reflect.apply(assertNever, undefined, ['unexpected'])).toThrow(
      new TypeError('Unexpected value: unexpected'),
    );
  });
});
