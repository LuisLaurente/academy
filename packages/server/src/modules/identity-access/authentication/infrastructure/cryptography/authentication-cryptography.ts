import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { argon2id, hash as argonHash, verify as argonVerify } from 'argon2';

import type { UuidService } from '../../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import type {
  GeneratedOpaqueToken,
  PasswordHasher,
  PasswordVerifier,
  TokenGenerationRequest,
  TokenGenerator,
  TokenVerificationError,
  TokenVerifier,
  VerifiedOpaqueToken,
} from '../../application/ports/cryptography.js';
import type { Argon2Configuration } from '../../configuration/authentication-configuration.js';
import { ExpiredTokenError, InvalidTokenError } from '../../domain/errors/authentication-errors.js';
import { SessionId, UserId } from '../../domain/identifiers/authentication-ids.js';
import { HashedPassword } from '../../domain/value-objects/hashed-password.js';
import type { PlainPassword } from '../../domain/value-objects/plain-password.js';

export class Argon2PasswordAdapter implements PasswordHasher, PasswordVerifier {
  readonly #configuration: Argon2Configuration;
  readonly #dummyPasswordHash: HashedPassword;

  private constructor(configuration: Argon2Configuration, dummyPasswordHash: HashedPassword) {
    this.#configuration = Object.freeze({ ...configuration });
    this.#dummyPasswordHash = dummyPasswordHash;
  }

  static async create(configuration: Argon2Configuration): Promise<Argon2PasswordAdapter> {
    const adapter = new Argon2PasswordAdapter(
      configuration,
      toHashedPassword(await hashWithArgon2(randomBytes(32).toString('base64url'), configuration)),
    );
    return adapter;
  }

  async hash(password: PlainPassword): Promise<HashedPassword> {
    return toHashedPassword(await hashWithArgon2(password.reveal(), this.#configuration));
  }

  async verify(password: PlainPassword, passwordHash?: HashedPassword): Promise<boolean> {
    try {
      return await argonVerify(
        (passwordHash ?? this.#dummyPasswordHash).reveal(),
        password.reveal(),
      );
    } catch {
      return false;
    }
  }
}

type OpaqueTokenKind = 'access' | 'refresh';

interface OpaqueTokenPayload {
  readonly expiresAtEpochMilliseconds: number;
  readonly kind: OpaqueTokenKind;
  readonly nonce: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly version: 1;
}

const TOKEN_PREFIX = 'los1';
const AES_GCM_ALGORITHM = 'aes-256-gcm';
const AUTHENTICATION_TAG_BYTES = 16;
const INITIALIZATION_VECTOR_BYTES = 12;

export class OpaqueTokenAdapter implements TokenGenerator, TokenVerifier {
  readonly #encryptionKey: Buffer;
  readonly #uuidService: UuidService;

  constructor(encryptionKey: Uint8Array, uuidService: UuidService) {
    if (encryptionKey.byteLength !== 32) {
      throw new RangeError('Opaque token encryption key must contain exactly 32 bytes.');
    }
    this.#encryptionKey = Buffer.from(encryptionKey);
    this.#uuidService = uuidService;
  }

  generateAccessToken(request: TokenGenerationRequest): Promise<GeneratedOpaqueToken> {
    return Promise.resolve(this.generate('access', request));
  }

  generateRefreshToken(request: TokenGenerationRequest): Promise<GeneratedOpaqueToken> {
    return Promise.resolve(this.generate('refresh', request));
  }

  matchesHash(candidateToken: string, storedTokenHash: string): boolean {
    const candidateHash = Buffer.from(hashToken(candidateToken), 'hex');
    const expectedHash = Buffer.from(storedTokenHash, 'hex');
    return (
      candidateHash.byteLength === expectedHash.byteLength &&
      timingSafeEqual(candidateHash, expectedHash)
    );
  }

  verifyAccessToken(
    token: string,
    at: Date,
  ): Promise<ResultType<VerifiedOpaqueToken, TokenVerificationError>> {
    return Promise.resolve(this.verify('access', token, at));
  }

  verifyRefreshToken(
    token: string,
    at: Date,
  ): Promise<ResultType<VerifiedOpaqueToken, TokenVerificationError>> {
    return Promise.resolve(this.verify('refresh', token, at));
  }

  private generate(kind: OpaqueTokenKind, request: TokenGenerationRequest): GeneratedOpaqueToken {
    const expiresAtEpochMilliseconds = request.expiresAt.getTime();
    if (!Number.isFinite(expiresAtEpochMilliseconds)) {
      throw new RangeError('Token expiration time must be valid.');
    }

    const payload: OpaqueTokenPayload = {
      expiresAtEpochMilliseconds,
      kind,
      nonce: randomBytes(16).toString('base64url'),
      sessionId: request.sessionId.toString(),
      userId: request.userId.toString(),
      version: 1,
    };
    const initializationVector = randomBytes(INITIALIZATION_VECTOR_BYTES);
    const cipher = createCipheriv(AES_GCM_ALGORITHM, this.#encryptionKey, initializationVector, {
      authTagLength: AUTHENTICATION_TAG_BYTES,
    });
    cipher.setAAD(Buffer.from(TOKEN_PREFIX, 'utf8'));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const token = [
      TOKEN_PREFIX,
      initializationVector.toString('base64url'),
      ciphertext.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
    ].join('.');

    return Object.freeze({ hash: hashToken(token), value: token });
  }

  private verify(
    expectedKind: OpaqueTokenKind,
    token: string,
    at: Date,
  ): ResultType<VerifiedOpaqueToken, TokenVerificationError> {
    if (!Number.isFinite(at.getTime())) {
      return Result.failure(new InvalidTokenError());
    }

    const payload = this.decrypt(token);
    if (payload === undefined || payload.kind !== expectedKind) {
      return Result.failure(new InvalidTokenError());
    }
    if (at.getTime() >= payload.expiresAtEpochMilliseconds) {
      return Result.failure(new ExpiredTokenError());
    }
    if (
      !this.#uuidService.isValid(payload.userId) ||
      !this.#uuidService.isValid(payload.sessionId)
    ) {
      return Result.failure(new InvalidTokenError());
    }

    return Result.success(
      Object.freeze({
        expiresAt: new Date(payload.expiresAtEpochMilliseconds),
        sessionId: SessionId.create(payload.sessionId),
        userId: UserId.create(payload.userId),
      }),
    );
  }

  private decrypt(token: string): OpaqueTokenPayload | undefined {
    try {
      const [prefix, initializationVector, ciphertext, authenticationTag, ...extra] =
        token.split('.');
      if (
        prefix !== TOKEN_PREFIX ||
        initializationVector === undefined ||
        ciphertext === undefined ||
        authenticationTag === undefined ||
        extra.length > 0
      ) {
        return undefined;
      }

      const initializationVectorBytes = decodeCanonicalBase64Url(initializationVector);
      const ciphertextBytes = decodeCanonicalBase64Url(ciphertext);
      const authenticationTagBytes = decodeCanonicalBase64Url(authenticationTag);
      if (
        initializationVectorBytes === undefined ||
        initializationVectorBytes.byteLength !== INITIALIZATION_VECTOR_BYTES ||
        ciphertextBytes === undefined ||
        ciphertextBytes.byteLength === 0 ||
        authenticationTagBytes === undefined ||
        authenticationTagBytes.byteLength !== AUTHENTICATION_TAG_BYTES
      ) {
        return undefined;
      }

      const decipher = createDecipheriv(
        AES_GCM_ALGORITHM,
        this.#encryptionKey,
        initializationVectorBytes,
        { authTagLength: AUTHENTICATION_TAG_BYTES },
      );
      decipher.setAAD(Buffer.from(TOKEN_PREFIX, 'utf8'));
      decipher.setAuthTag(authenticationTagBytes);
      const plaintext = Buffer.concat([
        decipher.update(ciphertextBytes),
        decipher.final(),
      ]).toString('utf8');
      const candidate: unknown = JSON.parse(plaintext);
      return isOpaqueTokenPayload(candidate) ? candidate : undefined;
    } catch {
      return undefined;
    }
  }
}

function hashWithArgon2(value: string, configuration: Argon2Configuration): Promise<string> {
  return argonHash(value, {
    hashLength: configuration.hashLength,
    memoryCost: configuration.memoryCostKiB,
    parallelism: configuration.parallelism,
    timeCost: configuration.timeCost,
    type: argon2id,
  });
}

function toHashedPassword(value: string): HashedPassword {
  const result = HashedPassword.create(value);
  if (!result.isSuccess) {
    throw result.error;
  }
  return result.value;
}

function hashToken(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function decodeCanonicalBase64Url(value: string): Buffer | undefined {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    return undefined;
  }
  const decoded = Buffer.from(value, 'base64url');
  return decoded.toString('base64url') === value ? decoded : undefined;
}

function isOpaqueTokenPayload(value: unknown): value is OpaqueTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    (candidate.kind === 'access' || candidate.kind === 'refresh') &&
    typeof candidate.nonce === 'string' &&
    candidate.nonce.length > 0 &&
    typeof candidate.userId === 'string' &&
    typeof candidate.sessionId === 'string' &&
    typeof candidate.expiresAtEpochMilliseconds === 'number' &&
    Number.isSafeInteger(candidate.expiresAtEpochMilliseconds)
  );
}
