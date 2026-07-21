export { BaseError, type BaseErrorOptions } from './errors/base-error.js';
export {
  ERROR_CATEGORIES,
  type ErrorCategory,
  type ErrorContext,
  type ErrorContextValue,
} from './errors/error-category.js';
export { DomainError, type DomainErrorOptions } from './errors/domain-error.js';
export { BaseException } from './exceptions/base-exception.js';
export {
  PermanentInfrastructureException,
  TransientInfrastructureException,
} from './exceptions/infrastructure-exception.js';
export { CryptoUuidService, type Uuid, type UuidService } from './identifiers/uuid-service.js';
export { assertNever } from './language/assert-never.js';
export {
  Result,
  type Failure,
  type ResultMatcher,
  type Result as ResultType,
  type Success,
} from './result/result.js';
export { SystemClock, type Clock } from './time/clock.js';
export { type Brand } from './types/brand.js';
export { ValueObject, type ValueObjectEqualityComponent } from './value-objects/value-object.js';
