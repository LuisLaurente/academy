import { PrismaCurriculumRepository } from '@learning-os/server/infrastructure';
import { describe, expect, it } from 'vitest';
import { CurriculumController } from './curriculum.controller';

describe('CurriculumController', () => {
  it('lists items and retrieves item by id', async () => {
    const repo = new PrismaCurriculumRepository();
    await repo.save({
      description: 'Fundamentals of Domain-Driven Design',
      difficulty: 'intermediate',
      estimatedMins: 45,
      id: 'curr-ddd-core',
      title: 'DDD Core Concepts',
    });

    const controller = new CurriculumController(repo);

    const items = await controller.getItems();
    expect(Array.isArray(items)).toBe(true);

    const item = await controller.getItemById('curr-ddd-core');
    expect(item.id).toBe('curr-ddd-core');
  });
});
