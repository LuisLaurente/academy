import type { UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Clock } from '../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import { AIGenerationRequest } from '../../domain/aggregates/ai-generation-request.js';
import {
  GenerationNotFoundError,
  PromptTemplateNotFoundError,
  UnsupportedGeneratorError,
  type AIPipelineError,
} from '../../domain/errors/ai-pipeline-errors.js';
import {
  GenerationMetadata,
  GenerationPolicy,
  ValidationReport,
} from '../../domain/models/generation-models.js';
import {
  GENERATOR_TYPES,
  GENERATION_STATUSES,
  REJECTED_REASONS,
} from '../../domain/types/ai-pipeline-types.js';
import {
  ConfidenceScore,
  GenerationId,
  MaxTokens,
  ModelName,
  QualityScore,
  SimilarityScore,
  Temperature,
  TopP,
} from '../../domain/value-objects/ai-pipeline-value-objects.js';
import type {
  CreateGenerationRequestInput,
  GenerationIdInput,
  GenerationStateOutput,
  RejectGenerationInput,
} from '../dtos/generation-commands.js';
import type {
  ContextBuilder,
  DifficultyEvaluator,
  DuplicateDetector,
  GenerationRepository,
  LLMGateway,
  PromptBuilder,
  PromptRepository,
  PromptValidator,
  PublicationGate,
  QualityEvaluator,
  ResponseValidator,
} from '../ports/ai-pipeline-ports.js';

type UseCaseResult<T> = Promise<ResultType<T, AIPipelineError>>;
interface BaseDependencies {
  readonly clock: Clock;
  readonly generationRepository: GenerationRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}
interface CreateDependencies extends BaseDependencies {
  readonly promptRepository: PromptRepository;
}
interface ValidateDependencies extends BaseDependencies {
  readonly contextBuilder: ContextBuilder;
  readonly difficultyEvaluator: DifficultyEvaluator;
  readonly duplicateDetector: DuplicateDetector;
  readonly llmGateway: LLMGateway;
  readonly promptBuilder: PromptBuilder;
  readonly promptValidator: PromptValidator;
  readonly qualityEvaluator: QualityEvaluator;
  readonly responseValidator: ResponseValidator;
}

export class CreateGenerationRequest {
  constructor(private readonly dependencies: CreateDependencies) {}
  async execute(input: CreateGenerationRequestInput): UseCaseResult<GenerationStateOutput> {
    if (input.generator !== GENERATOR_TYPES.Manual)
      return Result.failure(new UnsupportedGeneratorError(input.generator));
    const modelName = ModelName.create(input.modelName);
    if (!modelName.isSuccess) return modelName;
    const temperature = Temperature.create(input.temperature);
    if (!temperature.isSuccess) return temperature;
    const topP = TopP.create(input.topP);
    if (!topP.isSuccess) return topP;
    const maxTokens = MaxTokens.create(input.maxTokens);
    if (!maxTokens.isSuccess) return maxTokens;
    const minimumQuality = QualityScore.create(input.minimumQuality);
    if (!minimumQuality.isSuccess) return minimumQuality;
    const minimumConfidence = ConfidenceScore.create(input.minimumConfidence);
    if (!minimumConfidence.isSuccess) return minimumConfidence;
    const maximumSimilarity = SimilarityScore.create(input.maximumSimilarity);
    if (!maximumSimilarity.isSuccess) return maximumSimilarity;
    const policy = GenerationPolicy.create({
      maximumSimilarity: maximumSimilarity.value,
      minimumConfidence: minimumConfidence.value,
      minimumQuality: minimumQuality.value,
      targetDifficulty: input.targetDifficulty,
    });
    if (!policy.isSuccess) return policy;

    return this.dependencies.unitOfWork.execute(async () => {
      const template = await this.dependencies.promptRepository.findActiveByKey(input.templateKey);
      if (!template) return Result.failure(new PromptTemplateNotFoundError());
      const metadata = GenerationMetadata.create({
        generator: input.generator,
        maxTokens: maxTokens.value,
        modelName: modelName.value,
        temperature: temperature.value,
        template,
        topP: topP.value,
      });
      if (!metadata.isSuccess) return metadata;
      const now = this.dependencies.clock.now();
      const request = AIGenerationRequest.create({
        createdAt: now,
        eventId: this.dependencies.uuidService.generate(),
        id: GenerationId.create(this.dependencies.uuidService.generate()),
        metadata: metadata.value,
        policy: policy.value,
        updatedAt: now,
      });
      await this.dependencies.generationRepository.save(request);
      return Result.success(toOutput(request));
    });
  }
}

export class ValidateGeneration {
  constructor(private readonly dependencies: ValidateDependencies) {}
  execute(input: GenerationIdInput): UseCaseResult<GenerationStateOutput> {
    return this.dependencies.unitOfWork.execute(async () => {
      const request = await this.dependencies.generationRepository.findById(input.generationId);
      if (!request) return Result.failure(new GenerationNotFoundError());
      const prompt = await this.dependencies.promptBuilder.build(
        request,
        request.metadata.template,
      );
      if (!prompt.isSuccess) return prompt;
      const promptReport = await this.dependencies.promptValidator.validate(prompt.value);
      if (!promptReport.isSuccess) return promptReport;
      if (!promptReport.value.passed) {
        const rejection = request.reject(REJECTED_REASONS.InvalidStructure, this.transition());
        if (!rejection.isSuccess) return rejection;
        await this.dependencies.generationRepository.save(request);
        return Result.success(toOutput(request));
      }
      const context = await this.dependencies.contextBuilder.build(request);
      if (!context.isSuccess) return context;
      const started = request.startGeneration(prompt.value, this.transition());
      if (!started.isSuccess) return started;
      const generated = await this.dependencies.llmGateway.generate({
        context: context.value,
        metadata: request.metadata,
        prompt: prompt.value,
      });
      if (!generated.isSuccess) return this.rejectFailedComponent(request, generated);
      const responseReport = await this.dependencies.responseValidator.validate(generated.value);
      if (!responseReport.isSuccess) return this.rejectFailedComponent(request, responseReport);
      const quality = await this.dependencies.qualityEvaluator.evaluate(generated.value);
      if (!quality.isSuccess) return this.rejectFailedComponent(request, quality);
      const difficulty = await this.dependencies.difficultyEvaluator.evaluate(
        generated.value,
        request.policy.targetDifficulty,
      );
      if (!difficulty.isSuccess) return this.rejectFailedComponent(request, difficulty);
      const duplicate = await this.dependencies.duplicateDetector.analyze(generated.value);
      if (!duplicate.isSuccess) return this.rejectFailedComponent(request, duplicate);
      const completed = request.completeValidation(
        {
          difficulty: difficulty.value,
          duplicate: duplicate.value,
          quality: quality.value,
          result: generated.value,
          validation: ValidationReport.combine(promptReport.value, responseReport.value),
        },
        this.transition(),
      );
      if (!completed.isSuccess) return completed;
      await this.dependencies.generationRepository.save(request);
      return Result.success(toOutput(request));
    });
  }

  private async rejectFailedComponent<T>(
    request: AIGenerationRequest,
    failure: ResultType<T, AIPipelineError>,
  ): UseCaseResult<GenerationStateOutput> {
    if (failure.isSuccess) return Result.success(toOutput(request));
    const rejected = request.reject(REJECTED_REASONS.Other, this.transition());
    if (rejected.isSuccess) await this.dependencies.generationRepository.save(request);
    return Result.failure(failure.error);
  }

  private transition(): {
    readonly eventId: ReturnType<UuidService['generate']>;
    readonly occurredAt: Date;
  } {
    return {
      eventId: this.dependencies.uuidService.generate(),
      occurredAt: this.dependencies.clock.now(),
    };
  }
}

export class ApproveGeneration {
  constructor(private readonly dependencies: BaseDependencies) {}
  execute(input: GenerationIdInput): UseCaseResult<GenerationStateOutput> {
    return mutate(this.dependencies, input.generationId, (request) =>
      request.approve(transition(this.dependencies)),
    );
  }
}
export class RejectGeneration {
  constructor(private readonly dependencies: BaseDependencies) {}
  execute(input: RejectGenerationInput): UseCaseResult<GenerationStateOutput> {
    return mutate(this.dependencies, input.generationId, (request) =>
      request.reject(input.reason, transition(this.dependencies)),
    );
  }
}
export class PublishGeneration {
  constructor(
    private readonly dependencies: BaseDependencies & { readonly publicationGate: PublicationGate },
  ) {}
  execute(input: GenerationIdInput): UseCaseResult<GenerationStateOutput> {
    return this.dependencies.unitOfWork.execute(async () => {
      const request = await this.dependencies.generationRepository.findById(input.generationId);
      if (!request) return Result.failure(new GenerationNotFoundError());
      if (request.status !== GENERATION_STATUSES.Accepted) {
        const invalid = request.publish(transition(this.dependencies));
        return invalid.isSuccess ? Result.success(toOutput(request)) : invalid;
      }
      const publication = await this.dependencies.publicationGate.publish(request);
      if (!publication.isSuccess) return publication;
      const published = request.publish(transition(this.dependencies));
      if (!published.isSuccess) return published;
      await this.dependencies.generationRepository.save(request);
      return Result.success(toOutput(request));
    });
  }
}

async function mutate(
  dependencies: BaseDependencies,
  id: GenerationId,
  operation: (request: AIGenerationRequest) => ResultType<void, AIPipelineError>,
): UseCaseResult<GenerationStateOutput> {
  return dependencies.unitOfWork.execute(async () => {
    const request = await dependencies.generationRepository.findById(id);
    if (!request) return Result.failure(new GenerationNotFoundError());
    const result = operation(request);
    if (!result.isSuccess) return result;
    await dependencies.generationRepository.save(request);
    return Result.success(toOutput(request));
  });
}
function transition(dependencies: BaseDependencies): {
  readonly eventId: ReturnType<UuidService['generate']>;
  readonly occurredAt: Date;
} {
  return { eventId: dependencies.uuidService.generate(), occurredAt: dependencies.clock.now() };
}
function toOutput(request: AIGenerationRequest): GenerationStateOutput {
  return Object.freeze({
    generationId: request.id,
    status: request.status,
    version: request.aggregateVersion,
  });
}
