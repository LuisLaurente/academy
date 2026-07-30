import { PrismaCurriculumRepository } from '@learning-os/server/infrastructure';
import { describe, expect, it } from 'vitest';
import { CurriculumController } from './curriculum.controller';

describe('CurriculumController', () => {
  const controller = new CurriculumController(new PrismaCurriculumRepository());

  it('lists items and retrieves item by id', async () => {
    const items = await controller.getItems();
    expect(Array.isArray(items)).toBe(true);

    const item = await controller.getItemById('curr-ddd-core');
    expect(item.id).toBe('curr-ddd-core');
  });
});
