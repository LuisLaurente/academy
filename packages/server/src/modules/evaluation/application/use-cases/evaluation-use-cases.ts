import type { UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Clock } from '../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import { Evaluation, type EvaluationTransition } from '../../domain/aggregates/evaluation.js';
import {
  EvaluationResult,
  Feedback,
  Submission,
} from '../../domain/entities/evaluation-entities.js';
import {
  EvaluationAlreadyCompletedError,
  EvaluationNotFoundError,
  UnsupportedExerciseTypeError,
  type EvaluationError,
} from '../../domain/errors/evaluation-errors.js';
import { EvaluationId, SubmissionId } from '../../domain/identifiers/evaluation-identifiers.js';
import {
  ExecutionTime,
  FeedbackText,
  MemoryUsage,
  Score,
} from '../../domain/value-objects/evaluation-value-objects.js';
import type {
  CompleteEvaluationInput,
  EvaluationTransitionOutput,
  FailEvaluationInput,
  StartEvaluationInput,
  StartEvaluationOutput,
} from '../dtos/evaluation-commands.js';
import type {
  EvaluationRepository,
  ExerciseEvaluationDecision,
  ExerciseEvaluator,
} from '../ports/evaluation-ports.js';

export interface EvaluationUseCaseDependencies {
  readonly clock: Clock;
  readonly evaluator: ExerciseEvaluator;
  readonly repository: EvaluationRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}
type EvaluationUseCaseResult<T> = Promise<ResultType<T, EvaluationError>>;

export class StartEvaluation {
  constructor(private readonly dependencies: EvaluationUseCaseDependencies) {}
  async execute(input: StartEvaluationInput): EvaluationUseCaseResult<StartEvaluationOutput> {
    if (!this.dependencies.evaluator.supports(input.exerciseType))
      return Result.failure(new UnsupportedExerciseTypeError(input.exerciseType));
    const submittedAt = this.dependencies.clock.now();
    const submission = Submission.create({
      answer: input.answer,
      exerciseId: input.exerciseId,
      exerciseType: input.exerciseType,
      id: SubmissionId.create(this.dependencies.uuidService.generate()),
      submittedAt,
    });
    if (!submission.isSuccess) return submission;
    return this.dependencies.unitOfWork.execute(async () => {
      const evaluation = Evaluation.start({
        eventId: this.dependencies.uuidService.generate(),
        id: EvaluationId.create(this.dependencies.uuidService.generate()),
        startedAt: submittedAt,
        submission: submission.value,
      });
      await this.dependencies.repository.save(evaluation);
      return Result.success(
        Object.freeze({
          evaluationId: evaluation.id,
          status: evaluation.status,
          submissionId: submission.value.id,
          version: evaluation.aggregateVersion,
        }),
      );
    });
  }
}

export class CompleteEvaluation {
  constructor(private readonly dependencies: EvaluationUseCaseDependencies) {}
  async execute(
    input: CompleteEvaluationInput,
  ): EvaluationUseCaseResult<EvaluationTransitionOutput> {
    const current = await this.dependencies.repository.findById(input.evaluationId);
    if (!current) return Result.failure(new EvaluationNotFoundError());
    if (current.status !== 'started')
      return Result.failure(new EvaluationAlreadyCompletedError(current.status));
    const decision = await this.dependencies.evaluator.evaluate(current.submission);
    if (!decision.isSuccess) return decision;
    const prepared = prepareDecision(decision.value);
    if (!prepared.isSuccess) return prepared;
    return mutate(this.dependencies, input.evaluationId, (evaluation) =>
      evaluation.complete(
        prepared.value.result,
        prepared.value.feedback,
        transition(this.dependencies),
      ),
    );
  }
}

export class FailEvaluation {
  constructor(private readonly dependencies: EvaluationUseCaseDependencies) {}
  async execute(input: FailEvaluationInput): EvaluationUseCaseResult<EvaluationTransitionOutput> {
    const text = FeedbackText.create(input.feedback);
    if (!text.isSuccess) return text;
    const feedback = Feedback.create(text.value);
    return mutate(this.dependencies, input.evaluationId, (evaluation) =>
      evaluation.fail(input.reason, feedback, transition(this.dependencies)),
    );
  }
}

function prepareDecision(
  decision: ExerciseEvaluationDecision,
): ResultType<{ readonly feedback: Feedback; readonly result: EvaluationResult }, EvaluationError> {
  const score = Score.create(decision.score);
  if (!score.isSuccess) return score;
  const feedbackText = FeedbackText.create(decision.feedback);
  if (!feedbackText.isSuccess) return feedbackText;
  const executionTime = ExecutionTime.create(decision.executionTimeMilliseconds);
  if (!executionTime.isSuccess) return executionTime;
  const memoryUsage = MemoryUsage.create(decision.memoryUsageBytes);
  if (!memoryUsage.isSuccess) return memoryUsage;
  return Result.success({
    feedback: Feedback.create(feedbackText.value),
    result: EvaluationResult.create(
      decision.passed,
      score.value,
      executionTime.value,
      memoryUsage.value,
    ),
  });
}
async function mutate(
  dependencies: EvaluationUseCaseDependencies,
  evaluationId: EvaluationId,
  mutation: (evaluation: Evaluation) => ResultType<void, EvaluationError>,
): EvaluationUseCaseResult<EvaluationTransitionOutput> {
  return dependencies.unitOfWork.execute(async () => {
    const evaluation = await dependencies.repository.findById(evaluationId);
    if (!evaluation) return Result.failure(new EvaluationNotFoundError());
    const result = mutation(evaluation);
    if (!result.isSuccess) return result;
    await dependencies.repository.save(evaluation);
    return Result.success(
      Object.freeze({ status: evaluation.status, version: evaluation.aggregateVersion }),
    );
  });
}
function transition(dependencies: EvaluationUseCaseDependencies): EvaluationTransition {
  return { eventId: dependencies.uuidService.generate(), occurredAt: dependencies.clock.now() };
}
