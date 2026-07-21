export abstract class Specification<TCandidate> {
  abstract isSatisfiedBy(candidate: TCandidate): boolean;

  and(other: Specification<TCandidate>): Specification<TCandidate> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<TCandidate>): Specification<TCandidate> {
    return new OrSpecification(this, other);
  }

  not(): Specification<TCandidate> {
    return new NotSpecification(this);
  }
}

class AndSpecification<TCandidate> extends Specification<TCandidate> {
  constructor(
    private readonly left: Specification<TCandidate>,
    private readonly right: Specification<TCandidate>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: TCandidate): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<TCandidate> extends Specification<TCandidate> {
  constructor(
    private readonly left: Specification<TCandidate>,
    private readonly right: Specification<TCandidate>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: TCandidate): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<TCandidate> extends Specification<TCandidate> {
  constructor(private readonly specification: Specification<TCandidate>) {
    super();
  }

  isSatisfiedBy(candidate: TCandidate): boolean {
    return !this.specification.isSatisfiedBy(candidate);
  }
}
