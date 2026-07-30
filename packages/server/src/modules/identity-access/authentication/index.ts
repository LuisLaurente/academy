export type {
  AuthenticationTokensOutput,
  LoginUserInput,
  LogoutUserInput,
  RefreshSessionInput,
  RegisterUserInput,
  RegisterUserOutput,
  ValidateAccessTokenInput,
  ValidatedAccessTokenOutput,
} from './application/dtos/authentication-inputs.js';
export type {
  AuthenticationRepository,
  SessionRepository,
} from './application/ports/authentication-repositories.js';
export type {
  GeneratedOpaqueToken,
  PasswordHasher,
  PasswordVerifier,
  TokenGenerationRequest,
  TokenGenerator,
  TokenVerificationError,
  TokenVerifier,
  VerifiedOpaqueToken,
} from './application/ports/cryptography.js';
export {
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
  type Argon2Configuration,
  type PasswordHashingAlgorithm,
} from './configuration/authentication-configuration.js';
export { Session, User } from './domain/aggregates/authentication-aggregates.js';
export {
  AuthenticationError,
  EmailAlreadyExistsError,
  ExpiredTokenError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidHashedPasswordError,
  InvalidAuthenticationStateError,
  InvalidSessionError,
  InvalidTokenError,
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
export {
  Argon2PasswordAdapter,
  OpaqueTokenAdapter,
} from './infrastructure/cryptography/authentication-cryptography.js';
