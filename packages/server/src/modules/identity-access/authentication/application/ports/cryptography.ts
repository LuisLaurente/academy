import type { Result as ResultType } from '../../../../../core/result/result.js';
import type {
  ExpiredTokenError,
  InvalidTokenError,
} from '../../domain/errors/authentication-errors.js';
import type { SessionId, UserId } from '../../domain/identifiers/authentication-ids.js';
import type { HashedPassword } from '../../domain/value-objects/hashed-password.js';
import type { PlainPassword } from '../../domain/value-objects/plain-password.js';

export interface PasswordHasher {
  hash(password: PlainPassword): Promise<HashedPassword>;
}

export interface PasswordVerifier {
  verify(password: PlainPassword, passwordHash?: HashedPassword): Promise<boolean>;
}

export interface TokenGenerationRequest {
  readonly expiresAt: Date;
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface GeneratedOpaqueToken {
  readonly hash: string;
  readonly value: string;
}

export interface VerifiedOpaqueToken {
  readonly expiresAt: Date;
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export type TokenVerificationError = ExpiredTokenError | InvalidTokenError;

export interface TokenGenerator {
  generateAccessToken(request: TokenGenerationRequest): Promise<GeneratedOpaqueToken>;
  generateRefreshToken(request: TokenGenerationRequest): Promise<GeneratedOpaqueToken>;
}

export interface TokenVerifier {
  matchesHash(candidateToken: string, storedTokenHash: string): boolean;
  verifyAccessToken(
    token: string,
    at: Date,
  ): Promise<ResultType<VerifiedOpaqueToken, TokenVerificationError>>;
  verifyRefreshToken(
    token: string,
    at: Date,
  ): Promise<ResultType<VerifiedOpaqueToken, TokenVerificationError>>;
}
