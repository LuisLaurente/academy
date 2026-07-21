import { DomainError } from '../../../../../core/errors/domain-error.js';
import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import type {
  LoginUserInput,
  LogoutUserInput,
  RefreshSessionInput,
  RegisterUserInput,
  ValidateAccessTokenInput,
} from '../dtos/authentication-inputs.js';

export class AuthenticationUseCaseNotImplementedError extends DomainError<'authentication.use-case-not-implemented'> {
  constructor(useCase: string) {
    super({
      category: 'invariant',
      code: 'authentication.use-case-not-implemented',
      context: { useCase },
      message: 'The authentication use case is not implemented.',
    });
  }
}

type PendingAuthenticationResult = Promise<
  ResultType<never, AuthenticationUseCaseNotImplementedError>
>;

export class RegisterUser {
  execute(input: RegisterUserInput): PendingAuthenticationResult {
    void input;
    return notImplemented('RegisterUser');
  }
}

export class LoginUser {
  execute(input: LoginUserInput): PendingAuthenticationResult {
    void input;
    return notImplemented('LoginUser');
  }
}

export class LogoutUser {
  execute(input: LogoutUserInput): PendingAuthenticationResult {
    void input;
    return notImplemented('LogoutUser');
  }
}

export class RefreshSession {
  execute(input: RefreshSessionInput): PendingAuthenticationResult {
    void input;
    return notImplemented('RefreshSession');
  }
}

export class ValidateAccessToken {
  execute(input: ValidateAccessTokenInput): PendingAuthenticationResult {
    void input;
    return notImplemented('ValidateAccessToken');
  }
}

function notImplemented(useCase: string): PendingAuthenticationResult {
  return Promise.resolve(Result.failure(new AuthenticationUseCaseNotImplementedError(useCase)));
}
