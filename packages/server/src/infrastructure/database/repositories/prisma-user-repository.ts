import type {
  AuthenticationAccountSnapshot,
  AuthenticationRepository,
} from '../../../modules/identity-access/authentication/application/ports/authentication-repositories.js';
import type { UserId } from '../../../modules/identity-access/authentication/domain/identifiers/authentication-ids.js';
import type { Email } from '../../../modules/identity-access/authentication/domain/value-objects/email.js';
import type { DatabaseClient } from '../database-client.js';

export interface RawUserData {
  createdAt?: Date;
  email: string;
  id: string;
  passwordHash: string;
}

export class PrismaUserRepository implements AuthenticationRepository {
  private readonly memoryStore = new Map<string, AuthenticationAccountSnapshot>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findByEmail(email: Email): Promise<AuthenticationAccountSnapshot | undefined> {
    for (const snapshot of this.memoryStore.values()) {
      if (snapshot.email.value.toLowerCase() === email.value.toLowerCase()) {
        return snapshot;
      }
    }
    return undefined;
  }

  async findById(userId: UserId): Promise<AuthenticationAccountSnapshot | undefined> {
    return this.memoryStore.get(userId.value);
  }

  async save(account: AuthenticationAccountSnapshot): Promise<void> {
    this.memoryStore.set(account.userId.value, account);
  }

  async delete(userId: UserId): Promise<void> {
    this.memoryStore.delete(userId.value);
  }
}
