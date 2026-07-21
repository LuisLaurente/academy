import type { HashedPassword } from '../../domain/value-objects/hashed-password.js';
import type { PlainPassword } from '../../domain/value-objects/plain-password.js';

export interface PasswordHasher {
  hash(password: PlainPassword): Promise<HashedPassword>;
}

export interface PasswordVerifier {
  verify(password: PlainPassword, passwordHash: HashedPassword): Promise<boolean>;
}

export interface TokenGenerator {
  generate(): Promise<string>;
}

export interface TokenVerifier {
  verify(candidateToken: string, storedTokenHash: string): Promise<boolean>;
}
