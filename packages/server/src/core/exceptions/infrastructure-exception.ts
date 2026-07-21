import type { ErrorContext } from '../errors/error-category.js';
import { BaseException } from './base-exception.js';

interface InfrastructureExceptionOptions<TCode extends string> {
  readonly cause?: unknown;
  readonly code: TCode;
  readonly context?: ErrorContext;
  readonly message: string;
}

export abstract class TransientInfrastructureException<
  TCode extends string = string,
> extends BaseException<TCode> {
  readonly isRetryable = true;

  protected constructor(options: InfrastructureExceptionOptions<TCode>) {
    super({ ...options, category: 'dependency-transient' });
  }
}

export abstract class PermanentInfrastructureException<
  TCode extends string = string,
> extends BaseException<TCode> {
  readonly isRetryable = false;

  protected constructor(options: InfrastructureExceptionOptions<TCode>) {
    super({ ...options, category: 'dependency-permanent' });
  }
}
