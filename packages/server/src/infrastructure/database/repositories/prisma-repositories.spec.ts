import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import { UserId } from '../../../modules/identity-access/authentication/domain/identifiers/authentication-ids.js';
import { Email } from '../../../modules/identity-access/authentication/domain/value-objects/email.js';
import { HashedPassword } from '../../../modules/identity-access/authentication/domain/value-objects/hashed-password.js';
import { User } from '../../../modules/identity-access/authentication/domain/aggregates/authentication-aggregates.js';
import { PrismaContentRepository } from './prisma-content-repository.js';
import { PrismaCurriculumRepository } from './prisma-curriculum-repository.js';
import { PrismaEvaluationRepository } from './prisma-evaluation-repository.js';
import { PrismaExerciseRepository } from './prisma-exercise-repository.js';
import { PrismaUserRepository } from './prisma-user-repository.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('Prisma Repositories', () => {
  it('PrismaUserRepository saves and retrieves User by id and email', async () => {
    const repo = new PrismaUserRepository();
    const userId = UserId.create(uuidService.generate());
    const email = unwrap(Email.create('student@academy.edu'));
    const passwordHash = unwrap(HashedPassword.create('hashed_pwd_123456'));

    const user = User.register({
      active: true,
      createdAt: new Date(),
      email,
      eventId: uuidService.generate(),
      id: userId,
      passwordHash,
      updatedAt: new Date(),
    });

    await repo.save(user);

    const foundById = await repo.findById(userId);
    expect(foundById).toBeDefined();
    expect(foundById?.email.value).toBe('student@academy.edu');

    const foundByEmail = await repo.findByEmail(email);
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail?.id.equals(userId)).toBe(true);

    await repo.delete(userId);
    expect(await repo.findById(userId)).toBeUndefined();
  });

  it('PrismaCurriculumRepository saves and queries curriculum records', async () => {
    const repo = new PrismaCurriculumRepository();
    await repo.save({
      description: 'Introduction to DDD',
      difficulty: 'intermediate',
      estimatedMins: 45,
      id: 'curr-1',
      title: 'Domain Driven Design',
    });

    const all = await repo.findAll();
    expect(all.length).toBe(1);
    expect(all[0]?.title).toBe('Domain Driven Design');
  });

  it('PrismaContentRepository saves and deletes content block', async () => {
    const repo = new PrismaContentRepository();
    await repo.save({
      body: 'Lesson content here',
      contentType: 'text',
      id: 'cont-1',
      title: 'Intro',
      version: 'v1.0',
    });

    const found = await repo.findById('cont-1');
    expect(found?.title).toBe('Intro');

    await repo.delete('cont-1');
    expect(await repo.findById('cont-1')).toBeNull();
  });

  it('PrismaExerciseRepository and PrismaEvaluationRepository save and query records', async () => {
    const exRepo = new PrismaExerciseRepository();
    await exRepo.save({
      difficulty: 'hard',
      exerciseType: 'code',
      id: 'ex-1',
      prompt: 'Write a class',
      title: 'Coding Exercise',
    });

    expect((await exRepo.findById('ex-1'))?.difficulty).toBe('hard');

    const evalRepo = new PrismaEvaluationRepository();
    await evalRepo.save({
      evaluatedAt: new Date(),
      exerciseId: 'ex-1',
      id: 'eval-1',
      isPassed: true,
      score: 0.95,
      studentId: 'stud-100',
    });

    const evalList = await evalRepo.findByStudentId('stud-100');
    expect(evalList.length).toBe(1);
    expect(evalList[0]?.score).toBe(0.95);
  });
});
