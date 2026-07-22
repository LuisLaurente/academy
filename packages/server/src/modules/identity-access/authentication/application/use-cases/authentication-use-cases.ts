import type { UuidService } from '../../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import type { Clock } from '../../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../../domain/transactions/unit-of-work.js';
import type {
  AuthenticationTokensOutput,
  LoginUserInput,
  LogoutUserInput,
  RefreshSessionInput,
  RegisterUserInput,
  RegisterUserOutput,
  ValidateAccessTokenInput,
  ValidatedAccessTokenOutput,
} from '../dtos/authentication-inputs.js';
import type {
  AuthenticationRepository,
  SessionRepository,
} from '../ports/authentication-repositories.js';
import type {
  PasswordHasher,
  PasswordVerifier,
  TokenGenerator,
  TokenVerificationError,
  TokenVerifier,
} from '../ports/cryptography.js';
import type { AuthenticationConfiguration } from '../../configuration/authentication-configuration.js';
import { Session, User } from '../../domain/aggregates/authentication-aggregates.js';
import {
  EmailAlreadyExistsError,
  ExpiredTokenError,
  InvalidCredentialsError,
  type InvalidEmailError,
  InvalidSessionError,
  type InvalidTokenError,
  type WeakPasswordError,
} from '../../domain/errors/authentication-errors.js';
import { SessionId, UserId } from '../../domain/identifiers/authentication-ids.js';
import { Email } from '../../domain/value-objects/email.js';
import { PlainPassword } from '../../domain/value-objects/plain-password.js';

interface RegisterUserDependencies {
  readonly clock: Clock;
  readonly configuration: AuthenticationConfiguration;
  readonly passwordHasher: PasswordHasher;
  readonly repository: AuthenticationRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}

type RegisterUserError = EmailAlreadyExistsError | InvalidEmailError | WeakPasswordError;

export class RegisterUser {
  readonly #dependencies: RegisterUserDependencies;

  constructor(dependencies: RegisterUserDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(
    input: RegisterUserInput,
  ): Promise<ResultType<RegisterUserOutput, RegisterUserError>> {
    const emailResult = Email.create(input.email);
    if (!emailResult.isSuccess) {
      return emailResult;
    }
    const passwordResult = PlainPassword.create(
      input.password,
      this.#dependencies.configuration.minimumPasswordLength,
    );
    if (!passwordResult.isSuccess) {
      return passwordResult;
    }

    const passwordHash = await this.#dependencies.passwordHasher.hash(passwordResult.value);
    return this.#dependencies.unitOfWork.execute(async () => {
      if ((await this.#dependencies.repository.findByEmail(emailResult.value)) !== undefined) {
        return Result.failure(new EmailAlreadyExistsError());
      }

      const now = this.#dependencies.clock.now();
      const user = User.register({
        active: true,
        createdAt: now,
        email: emailResult.value,
        eventId: this.#dependencies.uuidService.generate(),
        id: UserId.create(this.#dependencies.uuidService.generate()),
        passwordHash,
        updatedAt: now,
      });
      await this.#dependencies.repository.save(user);
      return Result.success(Object.freeze({ userId: user.id }));
    });
  }
}

interface LoginUserDependencies {
  readonly clock: Clock;
  readonly configuration: AuthenticationConfiguration;
  readonly passwordVerifier: PasswordVerifier;
  readonly repository: AuthenticationRepository;
  readonly sessionRepository: SessionRepository;
  readonly tokenGenerator: TokenGenerator;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}

export class LoginUser {
  readonly #dependencies: LoginUserDependencies;

  constructor(dependencies: LoginUserDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(
    input: LoginUserInput,
  ): Promise<ResultType<AuthenticationTokensOutput, InvalidCredentialsError>> {
    const emailResult = Email.create(input.email);
    const passwordResult = PlainPassword.create(
      input.password,
      this.#dependencies.configuration.minimumPasswordLength,
    );
    if (!emailResult.isSuccess || !passwordResult.isSuccess) {
      return Result.failure(new InvalidCredentialsError());
    }

    const user = await this.#dependencies.repository.findByEmail(emailResult.value);
    const passwordMatches = await this.#dependencies.passwordVerifier.verify(
      passwordResult.value,
      user?.passwordHash,
    );
    if (!passwordMatches || user === undefined || !user.active) {
      return Result.failure(new InvalidCredentialsError());
    }

    const now = this.#dependencies.clock.now();
    const sessionId = SessionId.create(this.#dependencies.uuidService.generate());
    const accessTokenExpiresAt = addSeconds(
      now,
      this.#dependencies.configuration.accessTokenDurationSeconds,
    );
    const refreshTokenExpiresAt = addSeconds(
      now,
      this.#dependencies.configuration.refreshTokenDurationSeconds,
    );
    const tokenRequest = { sessionId, userId: user.id };
    const [accessToken, refreshToken] = await Promise.all([
      this.#dependencies.tokenGenerator.generateAccessToken({
        ...tokenRequest,
        expiresAt: accessTokenExpiresAt,
      }),
      this.#dependencies.tokenGenerator.generateRefreshToken({
        ...tokenRequest,
        expiresAt: refreshTokenExpiresAt,
      }),
    ]);
    const session = Session.start({
      createdAt: now,
      eventId: this.#dependencies.uuidService.generate(),
      expiresAt: refreshTokenExpiresAt,
      id: sessionId,
      refreshTokenHash: refreshToken.hash,
      userId: user.id,
    });
    await this.#dependencies.unitOfWork.execute(() =>
      this.#dependencies.sessionRepository.save(session),
    );

    return Result.success(
      createAuthenticationTokensOutput({
        accessToken: accessToken.value,
        accessTokenExpiresAt,
        refreshToken: refreshToken.value,
        refreshTokenExpiresAt,
        sessionId,
        userId: user.id,
      }),
    );
  }
}

interface LogoutUserDependencies {
  readonly clock: Clock;
  readonly sessionRepository: SessionRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}

export class LogoutUser {
  readonly #dependencies: LogoutUserDependencies;

  constructor(dependencies: LogoutUserDependencies) {
    this.#dependencies = dependencies;
  }

  execute(input: LogoutUserInput): Promise<ResultType<void, InvalidSessionError>> {
    return this.#dependencies.unitOfWork.execute(async () => {
      const session = await this.#dependencies.sessionRepository.findById(input.sessionId);
      if (session === undefined) {
        return Result.failure(new InvalidSessionError());
      }

      const revocation = session.revoke({
        at: this.#dependencies.clock.now(),
        eventId: this.#dependencies.uuidService.generate(),
      });
      if (!revocation.isSuccess) {
        return revocation;
      }
      await this.#dependencies.sessionRepository.save(session);
      return Result.success(undefined);
    });
  }
}

interface RefreshSessionDependencies {
  readonly clock: Clock;
  readonly configuration: AuthenticationConfiguration;
  readonly sessionRepository: SessionRepository;
  readonly tokenGenerator: TokenGenerator;
  readonly tokenVerifier: TokenVerifier;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}

type RefreshSessionError = ExpiredTokenError | InvalidSessionError | InvalidTokenError;

export class RefreshSession {
  readonly #dependencies: RefreshSessionDependencies;

  constructor(dependencies: RefreshSessionDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(
    input: RefreshSessionInput,
  ): Promise<ResultType<AuthenticationTokensOutput, RefreshSessionError>> {
    const now = this.#dependencies.clock.now();
    const tokenVerification = await this.#dependencies.tokenVerifier.verifyRefreshToken(
      input.refreshToken,
      now,
    );
    if (!tokenVerification.isSuccess) {
      return tokenVerification;
    }

    return this.#dependencies.unitOfWork.execute(async () => {
      const session = await this.#dependencies.sessionRepository.findById(
        tokenVerification.value.sessionId,
      );
      if (
        session === undefined ||
        !session.userId.equals(tokenVerification.value.userId) ||
        !this.#dependencies.tokenVerifier.matchesHash(input.refreshToken, session.refreshTokenHash)
      ) {
        return Result.failure(new InvalidSessionError());
      }
      if (session.isRevoked()) {
        return Result.failure(new InvalidSessionError());
      }
      if (session.isExpired(now)) {
        return Result.failure(new ExpiredTokenError());
      }

      const accessTokenExpiresAt = addSeconds(
        now,
        this.#dependencies.configuration.accessTokenDurationSeconds,
      );
      const refreshTokenExpiresAt = addSeconds(
        now,
        this.#dependencies.configuration.refreshTokenDurationSeconds,
      );
      const tokenRequest = { sessionId: session.id, userId: session.userId };
      const [accessToken, refreshToken] = await Promise.all([
        this.#dependencies.tokenGenerator.generateAccessToken({
          ...tokenRequest,
          expiresAt: accessTokenExpiresAt,
        }),
        this.#dependencies.tokenGenerator.generateRefreshToken({
          ...tokenRequest,
          expiresAt: refreshTokenExpiresAt,
        }),
      ]);
      const rotation = session.rotateRefreshToken({
        at: now,
        eventId: this.#dependencies.uuidService.generate(),
        expiresAt: refreshTokenExpiresAt,
        refreshTokenHash: refreshToken.hash,
      });
      if (!rotation.isSuccess) {
        return rotation;
      }
      await this.#dependencies.sessionRepository.save(session);

      return Result.success(
        createAuthenticationTokensOutput({
          accessToken: accessToken.value,
          accessTokenExpiresAt,
          refreshToken: refreshToken.value,
          refreshTokenExpiresAt,
          sessionId: session.id,
          userId: session.userId,
        }),
      );
    });
  }
}

interface ValidateAccessTokenDependencies {
  readonly clock: Clock;
  readonly tokenVerifier: TokenVerifier;
}

export class ValidateAccessToken {
  readonly #dependencies: ValidateAccessTokenDependencies;

  constructor(dependencies: ValidateAccessTokenDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(
    input: ValidateAccessTokenInput,
  ): Promise<ResultType<ValidatedAccessTokenOutput, TokenVerificationError>> {
    const verification = await this.#dependencies.tokenVerifier.verifyAccessToken(
      input.accessToken,
      this.#dependencies.clock.now(),
    );
    if (!verification.isSuccess) {
      return verification;
    }
    return Result.success(
      Object.freeze({
        expiresAt: verification.value.expiresAt,
        sessionId: verification.value.sessionId,
        userId: verification.value.userId,
      }),
    );
  }
}

function addSeconds(value: Date, seconds: number): Date {
  const epochMilliseconds = value.getTime() + seconds * 1000;
  if (!Number.isSafeInteger(epochMilliseconds)) {
    throw new RangeError('Authentication token expiration exceeds the supported date range.');
  }
  return new Date(epochMilliseconds);
}

function createAuthenticationTokensOutput(
  output: AuthenticationTokensOutput,
): AuthenticationTokensOutput {
  return Object.freeze({ ...output });
}
