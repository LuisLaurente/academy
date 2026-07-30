import { Entity } from '../../../../domain/entities/entity.js';
import type { GenerationArtifactId } from '../identifiers/ai-orchestration-ids.js';

export interface CreateGenerationArtifactProps {
  readonly artifactType: string;
  readonly contentPayload: string;
  readonly createdAt?: Date;
  readonly id: GenerationArtifactId;
}

export class GenerationArtifact extends Entity<GenerationArtifactId> {
  readonly artifactType: string;
  readonly contentPayload: string;
  readonly createdAt: Date;

  private constructor(props: CreateGenerationArtifactProps) {
    super(props.id);
    this.artifactType = props.artifactType;
    this.contentPayload = props.contentPayload;
    this.createdAt = props.createdAt ?? new Date();
    Object.freeze(this);
  }

  static create(props: CreateGenerationArtifactProps): GenerationArtifact {
    return new GenerationArtifact(props);
  }
}
