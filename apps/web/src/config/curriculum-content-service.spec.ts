import { describe, expect, it, vi } from 'vitest';
import { getContentBlockById, saveContentBlock } from './content-service.js';
import { getCurriculumItemById, getCurriculumItems } from './curriculum-service.js';

describe('Curriculum and Content Services', () => {
  it('fetches curriculum items list and single item', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => [
        {
          description: 'DDD Description',
          difficulty: 'intermediate',
          estimatedMins: 30,
          id: 'curr-ddd-core',
          title: 'DDD Fundamentals',
        },
      ],
      ok: true,
      status: 200,
    } as Response);

    const items = await getCurriculumItems();
    expect(items.length).toBe(1);
    expect(items[0]?.title).toBe('DDD Fundamentals');

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        description: 'DDD Description',
        difficulty: 'intermediate',
        estimatedMins: 30,
        id: 'curr-ddd-core',
        title: 'DDD Fundamentals',
      }),
      ok: true,
      status: 200,
    } as Response);

    const item = await getCurriculumItemById('curr-ddd-core');
    expect(item.id).toBe('curr-ddd-core');
  });

  it('fetches and saves content block', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        body: '# Test Markdown Body',
        contentType: 'text/markdown',
        id: 'cont-ddd-intro',
        title: 'DDD Intro',
        version: '1.0.0',
      }),
      ok: true,
      status: 200,
    } as Response);

    const block = await getContentBlockById('cont-ddd-intro');
    expect(block.title).toBe('DDD Intro');

    const saved = await saveContentBlock(block);
    expect(saved.id).toBe('cont-ddd-intro');
  });
});
