import { PrismaContentRepository } from '@learning-os/server/infrastructure';
import { describe, expect, it } from 'vitest';
import { ContentController } from './content.controller';

describe('ContentController', () => {
  it('creates and retrieves content block by id', async () => {
    const repository = new PrismaContentRepository();
    const controller = new ContentController(repository);

    const created = await controller.saveBlock({
      body: 'Test body content',
      contentType: 'markdown',
      id: 'cont-spec-1',
      title: 'Introduction to DDD',
      version: 'v1.0',
    });

    expect(created.id).toBe('cont-spec-1');

    const found = await controller.getBlockById('cont-spec-1');
    expect(found.title).toBe('Introduction to DDD');
  });
});
