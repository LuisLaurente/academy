export type {
  LoginUserInput,
  LogoutUserInput,
  RefreshSessionInput,
  RegisterUserInput,
  ValidateAccessTokenInput,
} from './application/dtos/authentication-inputs.js';
export type {
  AuthenticationAccountSnapshot,
  AuthenticationRepository,
  AuthenticationSessionSnapshot,
  SessionRepository,
} from './application/ports/authentication-repositories.js';
export type {
  PasswordHasher,
  PasswordVerifier,
  TokenGenerator,
  TokenVerifier,
} from './application/ports/cryptography.js';
export {
  AuthenticationUseCaseNotImplementedError,
  LoginUser,
  LogoutUser,
  RefreshSession,
  RegisterUser,
  ValidateAccessToken,
} from './application/use-cases/authentication-use-cases.js';
export {
  createAuthenticationConfiguration,
  type AuthenticationConfiguration,
  type AuthenticationConfigurationSource,
  type AuthenticationCookieConfiguration,
  type AuthenticationCookieSameSite,
  type PasswordHashingAlgorithm,
} from './configuration/authentication-configuration.js';
export {
  AuthenticationError,
  EmailAlreadyExistsError,
  ExpiredTokenError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidHashedPasswordError,
  InvalidSessionError,
  WeakPasswordError,
} from './domain/errors/authentication-errors.js';
export {
  SessionRefreshed,
  UserLoggedIn,
  UserLoggedOut,
  UserRegistered,
} from './domain/events/authentication-events.js';
export { SessionId, UserId } from './domain/identifiers/authentication-ids.js';
export { Email } from './domain/value-objects/email.js';
export { HashedPassword } from './domain/value-objects/hashed-password.js';
export { PlainPassword } from './domain/value-objects/plain-password.js';
