import type { ArtifactFile, ArtifactStorage } from './artifact-storage.js';

export class InMemoryArtifactStorage implements ArtifactStorage {
  private readonly store = new Map<string, ArtifactFile>();

  async storeArtifact(
    artifactId: string,
    contentPayload: string,
    contentType = 'application/json',
  ): Promise<ArtifactFile> {
    const file: ArtifactFile = {
      artifactId,
      contentPayload,
      contentType,
      createdAt: new Date(),
    };
    this.store.set(artifactId, file);
    return file;
  }

  async getArtifact(artifactId: string): Promise<ArtifactFile | null> {
    return this.store.get(artifactId) ?? null;
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    this.store.delete(artifactId);
  }

  async exists(artifactId: string): Promise<boolean> {
    return this.store.has(artifactId);
  }

  clear(): void {
    this.store.clear();
  }

  get count(): number {
    return this.store.size;
  }
}
