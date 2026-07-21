export type ValueObjectEqualityComponent = bigint | boolean | number | string | null | undefined;

export abstract class ValueObject {
  equals(other: unknown): boolean {
    if (!(other instanceof ValueObject) || other.constructor !== this.constructor) {
      return false;
    }

    const ownComponents = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();

    return (
      ownComponents.length === otherComponents.length &&
      ownComponents.every((component, index) => Object.is(component, otherComponents[index]))
    );
  }

  protected abstract getEqualityComponents(): readonly ValueObjectEqualityComponent[];
}
