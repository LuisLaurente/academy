import { PrismaCurriculumRepository } from '@learning-os/server/infrastructure';
import { describe, expect, it } from 'vitest';
import { CurriculumController } from './curriculum.controller';
import { CurriculumGenerationService } from './curriculum-generation.service';

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

    const generationServiceMock = {
      getItemWithDetails: async (id: string) => ({
        id,
        title: 'DDD Core Concepts',
        description: 'Fundamentals of Domain-Driven Design',
        difficulty: 'intermediate',
        estimatedMins: 45,
        levels: [],
      }),
    } as unknown as CurriculumGenerationService;

    const controller = new CurriculumController(repo, generationServiceMock);

    const items = await controller.getItems();
    expect(Array.isArray(items)).toBe(true);

    const item = await controller.getItemById('curr-ddd-core');
    expect(item.id).toBe('curr-ddd-core');
  });
});
