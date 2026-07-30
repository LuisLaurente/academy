import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { GenerationArtifact } from '../entities/generation-artifact.js';
import type { GenerationMetadata } from '../entities/generation-metadata.js';
import {
  GenerationAlreadyCompletedError,
  GenerationAlreadyRunningError,
  GenerationLimitExceededError,
  InvalidGenerationTransitionError,
} from '../errors/ai-orchestration-errors.js';
import {
  GenerationCompleted,
  GenerationFailed,
  GenerationRequested,
  GenerationStarted,
} from '../events/ai-orchestration-events.js';
import type { AIRequestId, GenerationJobId } from '../identifiers/ai-orchestration-ids.js';
import { GenerationAttempts } from '../value-objects/generation-attempts.js';
import { GenerationPriority } from '../value-objects/generation-priority.js';

export type RequestStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CreateGenerationRequestProps {
  readonly attempts?: GenerationAttempts;
  readonly contentId?: string | null;
  readonly createdAt?: Date;
  readonly curriculumItemId?: string | null;
  readonly eventId?: Uuid;
  readonly finishedAt?: Date | null;
  readonly id: AIRequestId;
  readonly priority?: GenerationPriority;
  readonly requestType: string;
  readonly startedAt?: Date | null;
  readonly status?: RequestStatus;
  readonly updatedAt?: Date;
}

export interface GenerationRequestTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class GenerationRequest extends AggregateRoot<AIRequestId> {
  readonly curriculumItemId: string | null;
  readonly contentId: string | null;
  readonly requestType: string;
  readonly createdAt: Date;

  private _status: RequestStatus;
  private _priority: GenerationPriority;
  private _attempts: GenerationAttempts;
  private _startedAt: Date | null;
  private _finishedAt: Date | null;
  private _updatedAt: Date;
  private _artifact: GenerationArtifact | null = null;
  private _metadata: GenerationMetadata | null = null;

  private constructor(props: CreateGenerationRequestProps) {
    super(props.id);
    this.curriculumItemId = props.curriculumItemId ?? null;
    this.contentId = props.contentId ?? null;
    this.requestType = props.requestType;
    this.createdAt = props.createdAt ?? new Date();
    this._startedAt = props.startedAt ?? null;
    this._finishedAt = props.finishedAt ?? null;
    this._status = props.status ?? 'pending';
    this._priority = props.priority ?? GenerationPriority.medium();
    this._attempts = props.attempts ?? GenerationAttempts.initial();
    this._updatedAt = props.updatedAt ?? this.createdAt;
  }

  static create(props: CreateGenerationRequestProps): GenerationRequest {
    const req = new GenerationRequest(props);

    if (props.eventId) {
      req.recordDomainEvent(
        new GenerationRequested({
          aggregateId: req.id,
          aggregateVersion: 1,
          contentId: req.contentId,
          curriculumItemId: req.curriculumItemId,
          eventId: props.eventId,
          occurredAt: req.createdAt,
          priority: req.priority.level,
          requestType: req.requestType,
        }),
      );
    }

    return req;
  }

  get status(): RequestStatus {
    return this._status;
  }

  get priority(): GenerationPriority {
    return this._priority;
  }

  get attempts(): GenerationAttempts {
    return this._attempts;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get finishedAt(): Date | null {
    return this._finishedAt;
  }

  get artifact(): GenerationArtifact | null {
    return this._artifact;
  }

  get metadata(): GenerationMetadata | null {
    return this._metadata;
  }

  get timestamps(): GenerationRequestTimestamps {
    return Object.freeze({
      createdAt: new Date(this.createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  isTerminal(): boolean {
    return this._status === 'completed' || (this._status === 'failed' && !this._attempts.canRetry);
  }

  start(jobId: GenerationJobId, eventId?: Uuid, now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'completed') {
      return Result.failure(new GenerationAlreadyCompletedError(this.id.toString()));
    }
    if (this._status === 'running') {
      return Result.failure(new GenerationAlreadyRunningError(this.id.toString()));
    }
    if (!this._attempts.canRetry) {
      return Result.failure(
        new GenerationLimitExceededError(this.id.toString(), this._attempts.max),
      );
    }

    const incRes = this._attempts.increment();
    if (incRes.isSuccess) {
      this._attempts = incRes.value;
    }

    this._status = 'running';
    this._startedAt = now;
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new GenerationStarted({
          aggregateId: this.id,
          aggregateVersion: 1,
          attemptNumber: this._attempts.current,
          eventId,
          jobId,
          occurredAt: now,
          startedAt: now,
        }),
      );
    }

    return Result.success(undefined);
  }

  complete(
    artifact: GenerationArtifact,
    metadata: GenerationMetadata,
    eventId?: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this._status === 'completed') {
      return Result.failure(new GenerationAlreadyCompletedError(this.id.toString()));
    }
    if (this._status !== 'running') {
      return Result.failure(
        new InvalidGenerationTransitionError('Cannot complete a request that is not running'),
      );
    }

    this._status = 'completed';
    this._finishedAt = now;
    this._updatedAt = now;
    this._artifact = artifact;
    this._metadata = metadata;

    if (eventId) {
      this.recordDomainEvent(
        new GenerationCompleted({
          aggregateId: this.id,
          aggregateVersion: 1,
          artifactId: artifact.id.toString(),
          durationMs: metadata.duration.durationMs,
          eventId,
          finishedAt: now,
          occurredAt: now,
          tokensUsed: metadata.cost.tokensUsed,
        }),
      );
    }

    return Result.success(undefined);
  }

  fail(reason: string, eventId?: Uuid, now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'completed') {
      return Result.failure(new GenerationAlreadyCompletedError(this.id.toString()));
    }

    this._status = 'failed';
    this._finishedAt = now;
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new GenerationFailed({
          aggregateId: this.id,
          aggregateVersion: 1,
          attemptNumber: this._attempts.current,
          canRetry: this._attempts.canRetry,
          eventId,
          failedAt: now,
          occurredAt: now,
          reason,
        }),
      );
    }

    return Result.success(undefined);
  }
}
