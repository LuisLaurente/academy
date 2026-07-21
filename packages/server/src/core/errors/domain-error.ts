import { BaseError, type BaseErrorOptions } from './base-error.js';

type DomainErrorCategory =
  'concurrency' | 'domain-conflict' | 'invariant' | 'not-found' | 'validation';

export interface DomainErrorOptions<TCode extends string> extends Omit<
  BaseErrorOptions<TCode>,
  'category'
> {
  readonly category: DomainErrorCategory;
}

export abstract class DomainError<TCode extends string = string> extends BaseError<TCode> {
  protected constructor(options: DomainErrorOptions<TCode>) {
    super(options);
  }
}
