import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import {
  GenerationNotApprovableError,
  InvalidGenerationDateError,
  InvalidGenerationStateError,
  InvalidGenerationVersionError,
  type AIPipelineError,
} from '../errors/ai-pipeline-errors.js';
import {
  GenerationApproved,
  GenerationPublished,
  GenerationRejected,
  GenerationRequested,
  GenerationValidated,
} from '../events/generation-events.js';
import type {
  AIGenerationResult,
  DifficultyAnalysis,
  DuplicateAnalysis,
  GenerationMetadata,
  GenerationPolicy,
  QualityReport,
  ValidationReport,
} from '../models/generation-models.js';
import {
  GENERATION_STATUSES,
  type GenerationStatus,
  type RejectedReason,
} from '../types/ai-pipeline-types.js';
import type { GenerationId, PromptText } from '../value-objects/ai-pipeline-value-objects.js';

interface ValidationBundle {
  readonly difficulty: DifficultyAnalysis;
  readonly duplicate: DuplicateAnalysis;
  readonly quality: QualityReport;
  readonly result: AIGenerationResult;
  readonly validation: ValidationReport;
}

interface PendingLifecycle {
  readonly status: typeof GENERATION_STATUSES.Pending;
}
interface GeneratingLifecycle {
  readonly prompt: PromptText;
  readonly status: typeof GENERATION_STATUSES.Generating;
}
interface ValidatingLifecycle extends ValidationBundle {
  readonly prompt: PromptText;
  readonly status: typeof GENERATION_STATUSES.Validating;
}
interface AcceptedLifecycle extends ValidationBundle {
  readonly prompt: PromptText;
  readonly status: typeof GENERATION_STATUSES.Accepted;
}
interface PublishedLifecycle extends ValidationBundle {
  readonly prompt: PromptText;
  readonly status: typeof GENERATION_STATUSES.Published;
}
interface RejectedLifecycle {
  readonly previousStatus: Exclude<GenerationStatus, 'Published' | 'Rejected'>;
  readonly prompt?: PromptText;
  readonly reason: RejectedReason;
  readonly status: typeof GENERATION_STATUSES.Rejected;
}

export type GenerationLifecycle =
  | PendingLifecycle
  | GeneratingLifecycle
  | ValidatingLifecycle
  | AcceptedLifecycle
  | RejectedLifecycle
  | PublishedLifecycle;
export interface GenerationTransition {
  readonly eventId: Uuid;
  readonly occurredAt: Date;
}
export interface AIGenerationRequestState {
  readonly aggregateVersion: number;
  readonly createdAt: Date;
  readonly id: GenerationId;
  readonly lifecycle: GenerationLifecycle;
  readonly metadata: GenerationMetadata;
  readonly policy: GenerationPolicy;
  readonly updatedAt: Date;
}

export class AIGenerationRequest extends AggregateRoot<GenerationId> {
  readonly metadata: GenerationMetadata;
  readonly policy: GenerationPolicy;
  #lifecycle: GenerationLifecycle;
  #aggregateVersion: number;
  readonly #createdAtEpoch: number;
  #updatedAtEpoch: number;

  private constructor(state: AIGenerationRequestState) {
    super(state.id);
    assertDate(state.createdAt, 'createdAt');
    assertDate(state.updatedAt, 'updatedAt');
    if (state.updatedAt.getTime() < state.createdAt.getTime())
      throw new InvalidGenerationDateError('updatedAt');
    if (!Number.isSafeInteger(state.aggregateVersion) || state.aggregateVersion < 1)
      throw new InvalidGenerationVersionError();
    if (!Object.values(GENERATION_STATUSES).includes(state.lifecycle.status))
      throw new InvalidGenerationStateError(state.lifecycle.status, 'rehydrate');
    this.metadata = state.metadata;
    this.policy = state.policy;
    this.#lifecycle = freezeLifecycle(state.lifecycle);
    this.#aggregateVersion = state.aggregateVersion;
    this.#createdAtEpoch = state.createdAt.getTime();
    this.#updatedAtEpoch = state.updatedAt.getTime();
  }

  static create(
    state: Omit<AIGenerationRequestState, 'aggregateVersion' | 'lifecycle'> & {
      readonly eventId: Uuid;
    },
  ): AIGenerationRequest {
    const request = new AIGenerationRequest({
      ...state,
      aggregateVersion: 1,
      lifecycle: { status: GENERATION_STATUSES.Pending },
    });
    request.recordDomainEvent(
      new GenerationRequested(
        request.envelope({ eventId: state.eventId, occurredAt: state.createdAt }),
        state.metadata.template.key,
      ),
    );
    return request;
  }

  static rehydrate(state: AIGenerationRequestState): AIGenerationRequest {
    return new AIGenerationRequest(state);
  }
  get status(): GenerationStatus {
    return this.#lifecycle.status;
  }
  get lifecycle(): GenerationLifecycle {
    return this.#lifecycle;
  }
  get aggregateVersion(): number {
    return this.#aggregateVersion;
  }
  get createdAt(): Date {
    return new Date(this.#createdAtEpoch);
  }
  get updatedAt(): Date {
    return new Date(this.#updatedAtEpoch);
  }

  startGeneration(
    prompt: PromptText,
    transition: GenerationTransition,
  ): ResultType<void, AIPipelineError> {
    if (this.#lifecycle.status !== GENERATION_STATUSES.Pending)
      return this.invalidState('start-generation');
    this.commit(transition);
    this.#lifecycle = Object.freeze({ prompt, status: GENERATION_STATUSES.Generating });
    return Result.success(undefined);
  }

  completeValidation(
    bundle: ValidationBundle,
    transition: GenerationTransition,
  ): ResultType<void, AIPipelineError> {
    if (this.#lifecycle.status !== GENERATION_STATUSES.Generating)
      return this.invalidState('complete-validation');
    this.commit(transition);
    this.#lifecycle = Object.freeze({
      ...bundle,
      prompt: this.#lifecycle.prompt,
      status: GENERATION_STATUSES.Validating,
    });
    this.recordDomainEvent(new GenerationValidated(this.envelope(transition)));
    return Result.success(undefined);
  }

  approve(transition: GenerationTransition): ResultType<void, AIPipelineError> {
    if (this.#lifecycle.status !== GENERATION_STATUSES.Validating)
      return this.invalidState('approve');
    const failedGate = this.failedGate(this.#lifecycle);
    if (failedGate !== undefined)
      return Result.failure(new GenerationNotApprovableError(failedGate));
    this.commit(transition);
    this.#lifecycle = Object.freeze({ ...this.#lifecycle, status: GENERATION_STATUSES.Accepted });
    this.recordDomainEvent(new GenerationApproved(this.envelope(transition)));
    return Result.success(undefined);
  }

  reject(
    reason: RejectedReason,
    transition: GenerationTransition,
  ): ResultType<void, AIPipelineError> {
    if (
      this.#lifecycle.status === GENERATION_STATUSES.Published ||
      this.#lifecycle.status === GENERATION_STATUSES.Rejected
    )
      return this.invalidState('reject');
    const previous = this.#lifecycle;
    this.commit(transition);
    this.#lifecycle = Object.freeze({
      ...(previous.status === GENERATION_STATUSES.Pending ? {} : { prompt: previous.prompt }),
      previousStatus: previous.status,
      reason,
      status: GENERATION_STATUSES.Rejected,
    });
    this.recordDomainEvent(new GenerationRejected(this.envelope(transition), reason));
    return Result.success(undefined);
  }

  publish(transition: GenerationTransition): ResultType<void, AIPipelineError> {
    if (this.#lifecycle.status !== GENERATION_STATUSES.Accepted)
      return this.invalidState('publish');
    this.commit(transition);
    this.#lifecycle = Object.freeze({ ...this.#lifecycle, status: GENERATION_STATUSES.Published });
    this.recordDomainEvent(new GenerationPublished(this.envelope(transition)));
    return Result.success(undefined);
  }

  private failedGate(lifecycle: ValidatingLifecycle): string | undefined {
    if (
      !lifecycle.validation.passed ||
      lifecycle.validation.confidence.value < this.policy.minimumConfidence.value
    )
      return 'validation';
    if (!lifecycle.quality.passes(this.policy)) return 'quality';
    if (!lifecycle.difficulty.passes(this.policy)) return 'difficulty';
    if (!lifecycle.duplicate.passes(this.policy)) return 'duplicate';
    return undefined;
  }

  private invalidState(operation: string): ResultType<void, InvalidGenerationStateError> {
    return Result.failure(new InvalidGenerationStateError(this.status, operation));
  }

  private commit(transition: GenerationTransition): void {
    assertDate(transition.occurredAt, 'occurredAt');
    if (transition.occurredAt.getTime() < this.#updatedAtEpoch)
      throw new InvalidGenerationDateError('occurredAt');
    this.#updatedAtEpoch = transition.occurredAt.getTime();
    this.#aggregateVersion += 1;
  }

  private envelope(transition: GenerationTransition): {
    readonly aggregateId: GenerationId;
    readonly aggregateVersion: number;
    readonly eventId: Uuid;
    readonly occurredAt: Date;
  } {
    return {
      aggregateId: this.id,
      aggregateVersion: this.#aggregateVersion,
      eventId: transition.eventId,
      occurredAt: transition.occurredAt,
    };
  }
}

function freezeLifecycle(lifecycle: GenerationLifecycle): GenerationLifecycle {
  return Object.freeze({ ...lifecycle });
}
function assertDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) throw new InvalidGenerationDateError(field);
}
