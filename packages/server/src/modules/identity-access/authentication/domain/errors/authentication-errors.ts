import { DomainError } from '../../../../../core/errors/domain-error.js';

export abstract class AuthenticationError<
  TCode extends string = string,
> extends DomainError<TCode> {}

export class InvalidCredentialsError extends AuthenticationError<'authentication.invalid-credentials'> {
  constructor() {
    super({
      category: 'validation',
      code: 'authentication.invalid-credentials',
      message: 'The supplied authentication credentials are invalid.',
    });
  }
}

export class EmailAlreadyExistsError extends AuthenticationError<'authentication.email-already-exists'> {
  constructor() {
    super({
      category: 'domain-conflict',
      code: 'authentication.email-already-exists',
      message: 'An account cannot be created with the supplied email address.',
    });
  }
}

export class WeakPasswordError extends AuthenticationError<'authentication.weak-password'> {
  constructor(minimumLength: number) {
    super({
      category: 'validation',
      code: 'authentication.weak-password',
      context: { minimumLength },
      message: 'The supplied password does not meet the minimum requirements.',
    });
  }
}

export class InvalidSessionError extends AuthenticationError<'authentication.invalid-session'> {
  constructor() {
    super({
      category: 'validation',
      code: 'authentication.invalid-session',
      message: 'The supplied session is invalid.',
    });
  }
}

export class ExpiredTokenError extends AuthenticationError<'authentication.expired-token'> {
  constructor() {
    super({
      category: 'validation',
      code: 'authentication.expired-token',
      message: 'The supplied token has expired.',
    });
  }
}

export class InvalidTokenError extends AuthenticationError<'authentication.invalid-token'> {
  constructor() {
    super({
      category: 'validation',
      code: 'authentication.invalid-token',
      message: 'The supplied token is invalid.',
    });
  }
}

export class InvalidAuthenticationStateError extends AuthenticationError<'authentication.invalid-state'> {
  constructor(reason: string) {
    super({
      category: 'invariant',
      code: 'authentication.invalid-state',
      context: { reason },
      message: 'Authentication state violates a domain invariant.',
    });
  }
}

export class InvalidEmailError extends AuthenticationError<'authentication.invalid-email'> {
  constructor() {
    super({
      category: 'validation',
      code: 'authentication.invalid-email',
      message: 'The supplied email address is invalid.',
    });
  }
}

export class InvalidHashedPasswordError extends AuthenticationError<'authentication.invalid-password-hash'> {
  constructor() {
    super({
      category: 'invariant',
      code: 'authentication.invalid-password-hash',
      message: 'A password hash must not be empty.',
    });
  }
}
