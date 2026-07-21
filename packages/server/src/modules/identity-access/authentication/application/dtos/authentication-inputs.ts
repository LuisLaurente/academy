import type { SessionId } from '../../domain/identifiers/authentication-ids.js';

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
