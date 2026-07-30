import { describe, expect, it } from 'vitest';
import { InMemoryArtifactStorage } from './in-memory-artifact-storage.js';
import { S3ArtifactStorageAdapter } from './s3-artifact-storage-adapter.js';

describe('ArtifactStorage Infrastructure', () => {
  it('InMemoryArtifactStorage stores, retrieves, and deletes artifacts', async () => {
    const storage = new InMemoryArtifactStorage();

    const stored = await storage.storeArtifact('art-101', '{"question": "2+2?"}');
    expect(stored.artifactId).toBe('art-101');
    expect(await storage.exists('art-101')).toBe(true);

    const retrieved = await storage.getArtifact('art-101');
    expect(retrieved?.contentPayload).toBe('{"question": "2+2?"}');

    await storage.deleteArtifact('art-101');
    expect(await storage.exists('art-101')).toBe(false);
  });

  it('S3ArtifactStorageAdapter handles S3 storage operations', async () => {
    const s3Adapter = new S3ArtifactStorageAdapter('learning-os-artifacts');
    expect(s3Adapter.bucket).toBe('learning-os-artifacts');

    const stored = await s3Adapter.storeArtifact('art-202', '{"data": "content"}');
    expect(stored.artifactId).toBe('art-202');
  });
});
