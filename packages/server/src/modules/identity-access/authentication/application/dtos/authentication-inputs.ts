import type { SessionId, UserId } from '../../domain/identifiers/authentication-ids.js';

export interface RegisterUserInput {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
}

export interface LogoutUserInput {
  readonly sessionId: SessionId;
}

export interface RefreshSessionInput {
  readonly refreshToken: string;
}

export interface ValidateAccessTokenInput {
  readonly accessToken: string;
}

export interface RegisterUserOutput {
  readonly userId: UserId;
}

export interface AuthenticationTokensOutput {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface ValidatedAccessTokenOutput {
  readonly expiresAt: Date;
  readonly sessionId: SessionId;
  readonly userId: UserId;
}
