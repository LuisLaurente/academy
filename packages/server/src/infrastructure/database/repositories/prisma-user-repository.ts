import type { AuthenticationRepository } from '../../../modules/identity-access/authentication/application/ports/authentication-repositories.js';
import { type User } from '../../../modules/identity-access/authentication/domain/aggregates/authentication-aggregates.js';
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
  private readonly memoryStore = new Map<string, User>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findByEmail(email: Email): Promise<User | undefined> {
    for (const user of this.memoryStore.values()) {
      if (user.email.value.toLowerCase() === email.value.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async findById(userId: UserId): Promise<User | undefined> {
    return this.memoryStore.get(userId.value);
  }

  async save(user: User): Promise<void> {
    this.memoryStore.set(user.id.value, user);
  }

  async delete(userId: UserId): Promise<void> {
    this.memoryStore.delete(userId.value);
  }
}
