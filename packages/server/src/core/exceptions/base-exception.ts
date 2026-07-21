import { BaseError, type BaseErrorOptions } from '../errors/base-error.js';

export abstract class BaseException<TCode extends string = string> extends BaseError<TCode> {
  protected constructor(options: BaseErrorOptions<TCode>) {
    super(options);
  }
}
