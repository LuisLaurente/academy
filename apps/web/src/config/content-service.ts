import { apiFetch } from './api-client.js';

export interface ContentBlock {
  readonly body: string;
  readonly contentType: string;
  readonly id: string;
  readonly title: string;
  readonly version: string;
}

export async function getContentBlockById(id: string): Promise<ContentBlock> {
  return apiFetch<ContentBlock>(`/content/blocks/${id}`);
}

export async function saveContentBlock(block: ContentBlock): Promise<ContentBlock> {
  return apiFetch<ContentBlock>('/content/blocks', {
    body: JSON.stringify(block),
    method: 'POST',
  });
}
