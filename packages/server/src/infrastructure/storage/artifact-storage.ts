export interface ArtifactFile {
  readonly artifactId: string;
  readonly contentPayload: string;
  readonly contentType: string;
  readonly createdAt: Date;
}

export interface ArtifactStorage {
  deleteArtifact(artifactId: string): Promise<void>;

  exists(artifactId: string): Promise<boolean>;

  getArtifact(artifactId: string): Promise<ArtifactFile | null>;

  storeArtifact(
    artifactId: string,
    contentPayload: string,
    contentType?: string,
  ): Promise<ArtifactFile>;
}
