import { describe, expect, it, vi } from 'vitest';

import { Specification } from './specification.js';

class PredicateSpecification<TCandidate> extends Specification<TCandidate> {
  constructor(private readonly predicate: (candidate: TCandidate) => boolean) {
    super();
  }

  isSatisfiedBy(candidate: TCandidate): boolean {
    return this.predicate(candidate);
  }
}

describe('Specification', () => {
  const isPositive = new PredicateSpecification<number>((candidate) => candidate > 0);
  const isEven = new PredicateSpecification<number>((candidate) => candidate % 2 === 0);

  it('composes specifications with AND', () => {
    const specification = isPositive.and(isEven);

    expect(specification.isSatisfiedBy(2)).toBe(true);
    expect(specification.isSatisfiedBy(-2)).toBe(false);
    expect(specification.isSatisfiedBy(3)).toBe(false);
  });

  it('composes specifications with OR', () => {
    const specification = isPositive.or(isEven);

    expect(specification.isSatisfiedBy(3)).toBe(true);
    expect(specification.isSatisfiedBy(-2)).toBe(true);
    expect(specification.isSatisfiedBy(-3)).toBe(false);
  });

  it('negates and nests specifications without changing the originals', () => {
    const positiveOdd = isPositive.and(isEven.not());

    expect(positiveOdd.isSatisfiedBy(3)).toBe(true);
    expect(positiveOdd.isSatisfiedBy(2)).toBe(false);
    expect(isEven.isSatisfiedBy(2)).toBe(true);
  });

  it('short-circuits composed predicates', () => {
    const rightPredicate = vi.fn(() => true);
    const right = new PredicateSpecification(rightPredicate);

    expect(new PredicateSpecification<number>(() => false).and(right).isSatisfiedBy(1)).toBe(false);
    expect(rightPredicate).not.toHaveBeenCalled();

    expect(new PredicateSpecification<number>(() => true).or(right).isSatisfiedBy(1)).toBe(true);
    expect(rightPredicate).not.toHaveBeenCalled();
  });
});
