import type { ErrorCategory, ErrorContext } from './error-category.js';

export interface BaseErrorOptions<TCode extends string> {
  readonly category: ErrorCategory;
  readonly cause?: unknown;
  readonly code: TCode;
  readonly context?: ErrorContext;
  readonly message: string;
}

export abstract class BaseError<TCode extends string = string> extends Error {
  readonly category: ErrorCategory;
  readonly code: TCode;
  readonly context: ErrorContext;

  protected constructor(options: BaseErrorOptions<TCode>) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });

    this.name = new.target.name;
    this.category = options.category;
    this.code = options.code;
    this.context = Object.freeze({ ...options.context });
  }
}
