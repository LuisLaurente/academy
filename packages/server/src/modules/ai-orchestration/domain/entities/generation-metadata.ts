import { Entity } from '../../../../domain/entities/entity.js';
import type { GenerationMetadataId } from '../identifiers/ai-orchestration-ids.js';
import type { GenerationCost } from '../value-objects/generation-cost.js';
import type { GenerationDuration } from '../value-objects/generation-duration.js';
import type { PromptVersion } from '../value-objects/prompt-version.js';

export interface CreateGenerationMetadataProps {
  readonly cost: GenerationCost;
  readonly duration: GenerationDuration;
  readonly id: GenerationMetadataId;
  readonly modelName: string;
  readonly promptVersion: PromptVersion;
}

export class GenerationMetadata extends Entity<GenerationMetadataId> {
  readonly modelName: string;
  readonly promptVersion: PromptVersion;
  readonly cost: GenerationCost;
  readonly duration: GenerationDuration;

  private constructor(props: CreateGenerationMetadataProps) {
    super(props.id);
    this.modelName = props.modelName;
    this.promptVersion = props.promptVersion;
    this.cost = props.cost;
    this.duration = props.duration;
    Object.freeze(this);
  }

  static create(props: CreateGenerationMetadataProps): GenerationMetadata {
    return new GenerationMetadata(props);
  }
}
