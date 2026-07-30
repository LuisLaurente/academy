import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class AIRequestId extends EntityId<'GenerationRequest'> {
  static create(value: Uuid): AIRequestId {
    return new AIRequestId(value);
  }
}

export class GenerationJobId extends EntityId<'GenerationJob'> {
  static create(value: Uuid): GenerationJobId {
    return new GenerationJobId(value);
  }
}

export class GenerationArtifactId extends EntityId<'GenerationArtifact'> {
  static create(value: Uuid): GenerationArtifactId {
    return new GenerationArtifactId(value);
  }
}

export class GenerationMetadataId extends EntityId<'GenerationMetadata'> {
  static create(value: Uuid): GenerationMetadataId {
    return new GenerationMetadataId(value);
  }
}
