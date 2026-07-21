import { describe, expect, it } from 'vitest';

import { ValueObject } from './value-object.js';

class TestCoordinates extends ValueObject {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {
    super();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.x, this.y];
  }
}

class TestDimensions extends ValueObject {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    super();
  }

  protected getEqualityComponents(): readonly number[] {
    return [this.width, this.height];
  }
}

describe('ValueObject', () => {
  it('compares instances of the same class by ordered equality components', () => {
    expect(new TestCoordinates(10, 20).equals(new TestCoordinates(10, 20))).toBe(true);
    expect(new TestCoordinates(10, 20).equals(new TestCoordinates(20, 10))).toBe(false);
  });

  it('does not equate different value object classes with equal components', () => {
    expect(new TestCoordinates(10, 20).equals(new TestDimensions(10, 20))).toBe(false);
  });

  it('returns false for absent and non-value-object candidates', () => {
    const coordinates = new TestCoordinates(10, 20);

    expect(coordinates.equals(undefined)).toBe(false);
    expect(coordinates.equals(null)).toBe(false);
    expect(coordinates.equals({ x: 10, y: 20 })).toBe(false);
  });

  it('uses Object.is semantics for edge-case numeric components', () => {
    expect(new TestCoordinates(Number.NaN, -0).equals(new TestCoordinates(Number.NaN, -0))).toBe(
      true,
    );
    expect(new TestCoordinates(0, 1).equals(new TestCoordinates(-0, 1))).toBe(false);
  });
});
