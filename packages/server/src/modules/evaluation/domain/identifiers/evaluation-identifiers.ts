import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class EvaluationId extends EntityId<'Evaluation'> {
  static create(value: Uuid): EvaluationId {
    return new EvaluationId(value);
  }
}

export class SubmissionId extends EntityId<'Submission'> {
  static create(value: Uuid): SubmissionId {
    return new SubmissionId(value);
  }
}
