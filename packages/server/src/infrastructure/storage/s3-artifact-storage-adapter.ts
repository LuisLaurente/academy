import type { ArtifactFile, ArtifactStorage } from './artifact-storage.js';

export interface S3ClientLike {
  deleteObject(params: { Bucket: string; Key: string }): Promise<unknown>;
  getObject(params: { Bucket: string; Key: string }): Promise<{ Body: string }>;
  putObject(params: {
    Body: string;
    Bucket: string;
    ContentType: string;
    Key: string;
  }): Promise<unknown>;
}

export class S3ArtifactStorageAdapter implements ArtifactStorage {
  constructor(
    private readonly bucketName: string,
    private readonly s3Client?: S3ClientLike,
  ) {}

  async storeArtifact(
    artifactId: string,
    contentPayload: string,
    contentType = 'application/json',
  ): Promise<ArtifactFile> {
    if (this.s3Client) {
      await this.s3Client.putObject({
        Body: contentPayload,
        Bucket: this.bucketName,
        ContentType: contentType,
        Key: `artifacts/${artifactId}`,
      });
    }

    return {
      artifactId,
      contentPayload,
      contentType,
      createdAt: new Date(),
    };
  }

  async getArtifact(artifactId: string): Promise<ArtifactFile | null> {
    if (this.s3Client) {
      try {
        const obj = await this.s3Client.getObject({
          Bucket: this.bucketName,
          Key: `artifacts/${artifactId}`,
        });
        return {
          artifactId,
          contentPayload: obj.Body,
          contentType: 'application/json',
          createdAt: new Date(),
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    if (this.s3Client) {
      await this.s3Client.deleteObject({
        Bucket: this.bucketName,
        Key: `artifacts/${artifactId}`,
      });
    }
  }

  async exists(artifactId: string): Promise<boolean> {
    const artifact = await this.getArtifact(artifactId);
    return artifact !== null;
  }

  get bucket(): string {
    return this.bucketName;
  }
}
