import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../core/result/result.js';
import type { Clock } from '../../core/time/clock.js';
import {
  ApproveGeneration,
  CreateGenerationRequest,
  PublishGeneration,
  RejectGeneration,
  ValidateGeneration,
} from './application/use-cases/ai-pipeline-use-cases.js';
import type { LLMGateway, LLMGenerationInput } from './application/ports/ai-pipeline-ports.js';
import type { AIPipelineError } from './domain/errors/ai-pipeline-errors.js';
import {
  GenerationNotApprovableError,
  GenerationNotFoundError,
  InvalidAIValueError,
  PipelineComponentError,
  PromptTemplateNotFoundError,
  PublicationDeniedError,
  UnsupportedGeneratorError,
} from './domain/errors/ai-pipeline-errors.js';
import {
  AIGenerationResult,
  DifficultyAnalysis,
  DuplicateAnalysis,
  GenerationMetadata,
  PromptTemplate,
  QualityReport,
  ValidationReport,
} from './domain/models/generation-models.js';
import {
  GENERATOR_TYPES,
  REJECTED_REASONS,
  type GeneratorType,
} from './domain/types/ai-pipeline-types.js';
import {
  ConfidenceScore,
  GenerationId,
  MaxTokens,
  ModelName,
  PromptText,
  QualityScore,
  SimilarityScore,
  Temperature,
  TopP,
} from './domain/value-objects/ai-pipeline-value-objects.js';
import {
  FakeAIPipelineUnitOfWork,
  FakeContextBuilder,
  FakeDifficultyEvaluator,
  FakeDuplicateDetector,
  FakeLLMGateway,
  FakePromptBuilder,
  FakePromptRepository,
  FakePromptValidator,
  FakePublicationGate,
  FakeQualityEvaluator,
  FakeResponseValidator,
  InMemoryGenerationRepository,
  type PipelineCallLog,
} from './infrastructure/testing/fake-ai-pipeline.js';

const NOW = new Date('2026-07-21T20:00:00.000Z');
const uuid = new CryptoUuidService();
class FixedClock implements Clock {
  now(): Date {
    return new Date(NOW);
  }
}
function value<T, E>(result: ResultType<T, E>): T {
  if (!result.isSuccess) throw result.error;
  return result.value;
}
const confidence = (score = 0.95) => value(ConfidenceScore.create(score));
const validation = (passed = true) =>
  value(
    ValidationReport.create({
      confidence: confidence(),
      findings: passed ? [] : ['Invalid prompt structure'],
      passed,
    }),
  );
function template(
  generator: GeneratorType = GENERATOR_TYPES.Manual,
  active = true,
): PromptTemplate {
  return value(
    PromptTemplate.create({
      active,
      generator,
      key: 'lesson.theory',
      purpose: 'Generate lesson theory',
      version: 1,
    }),
  );
}
function generationMetadata(current = template()): GenerationMetadata {
  return value(
    GenerationMetadata.create({
      generator: current.generator,
      maxTokens: value(MaxTokens.create(2_000)),
      modelName: value(ModelName.create('fake-model-v1')),
      temperature: value(Temperature.create(0.2)),
      template: current,
      topP: value(TopP.create(0.9)),
    }),
  );
}
function result(current = template()): AIGenerationResult {
  return value(
    AIGenerationResult.create({
      completedAt: NOW,
      content: '{"theory":"deterministic output"}',
      metadata: generationMetadata(current),
    }),
  );
}
function input(
  overrides: Partial<Parameters<CreateGenerationRequest['execute']>[0]> = {},
): Parameters<CreateGenerationRequest['execute']>[0] {
  return {
    generator: GENERATOR_TYPES.Manual,
    maximumSimilarity: 0.3,
    maxTokens: 2_000,
    minimumConfidence: 0.8,
    minimumQuality: 85,
    modelName: 'fake-model-v1',
    targetDifficulty: 3,
    temperature: 0.2,
    templateKey: 'lesson.theory',
    topP: 0.9,
    ...overrides,
  };
}

interface FixtureOptions {
  readonly approvedForPublication?: boolean;
  readonly observedDifficulty?: number;
  readonly promptIsValid?: boolean;
  readonly quality?: number;
  readonly responseIsValid?: boolean;
  readonly template?: PromptTemplate;
}
function fixture(options: FixtureOptions = {}) {
  const callLog: PipelineCallLog = [];
  const currentTemplate = options.template ?? template();
  const repository = new InMemoryGenerationRepository();
  const unitOfWork = new FakeAIPipelineUnitOfWork();
  const base = {
    clock: new FixedClock(),
    generationRepository: repository,
    unitOfWork,
    uuidService: uuid,
  };
  const create = new CreateGenerationRequest({
    ...base,
    promptRepository: new FakePromptRepository([currentTemplate]),
  });
  const validate = new ValidateGeneration({
    ...base,
    contextBuilder: new FakeContextBuilder(callLog),
    difficultyEvaluator: new FakeDifficultyEvaluator(
      callLog,
      value(
        DifficultyAnalysis.create({
          confidence: confidence(),
          expected: 3,
          observed: options.observedDifficulty ?? 3,
        }),
      ),
    ),
    duplicateDetector: new FakeDuplicateDetector(
      callLog,
      new DuplicateAnalysis(value(SimilarityScore.create(0.1)), confidence()),
    ),
    llmGateway: new FakeLLMGateway(callLog, result()),
    promptBuilder: new FakePromptBuilder(
      callLog,
      value(PromptText.create('deterministic prompt shell')),
    ),
    promptValidator: new FakePromptValidator(callLog, validation(options.promptIsValid ?? true)),
    qualityEvaluator: new FakeQualityEvaluator(
      callLog,
      new QualityReport(value(QualityScore.create(options.quality ?? 90)), confidence()),
    ),
    responseValidator: new FakeResponseValidator(
      callLog,
      validation(options.responseIsValid ?? true),
    ),
  });
  return {
    approve: new ApproveGeneration(base),
    callLog,
    create,
    publish: new PublishGeneration({
      ...base,
      publicationGate: new FakePublicationGate(callLog, options.approvedForPublication ?? true),
    }),
    reject: new RejectGeneration(base),
    repository,
    unitOfWork,
    validate,
  };
}
async function createRequest(
  target = fixture(),
): Promise<{ readonly generationId: GenerationId; readonly target: ReturnType<typeof fixture> }> {
  const created = await target.create.execute(input());
  if (!created.isSuccess) throw created.error;
  return { generationId: created.value.generationId, target };
}

describe('CreateGenerationRequest', () => {
  it('creates a deterministic Pending request from an active repository template', async () => {
    const target = fixture();
    const created = await target.create.execute(input());
    expect(created.isSuccess).toBe(true);
    expect(target.repository.size).toBe(1);
    if (!created.isSuccess) return;
    expect(created.value).toMatchObject({ status: 'Pending', version: 1 });
    expect((await target.repository.findById(created.value.generationId))?.metadata.generator).toBe(
      'Manual',
    );
  });
  it('rejects generators that are modeled but not enabled in this sprint', async () => {
    for (const generator of [GENERATOR_TYPES.Gemini, GENERATOR_TYPES.FutureLLM]) {
      const response = await fixture().create.execute(input({ generator }));
      expect(response.isSuccess).toBe(false);
      if (!response.isSuccess) expect(response.error).toBeInstanceOf(UnsupportedGeneratorError);
    }
  });
  it.each([
    { modelName: 'invalid model' },
    { temperature: 3 },
    { topP: 0 },
    { maxTokens: 0 },
    { minimumQuality: 101 },
    { minimumConfidence: 2 },
    { maximumSimilarity: -1 },
    { targetDifficulty: 6 },
  ])('validates creation policy and model parameters %#', async (override) => {
    const response = await fixture().create.execute(input(override));
    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) expect(response.error).toBeInstanceOf(InvalidAIValueError);
  });
  it('rejects missing, inactive and generator-incompatible templates', async () => {
    const missing = await fixture().create.execute(input({ templateKey: 'missing.template' }));
    expect(missing.isSuccess).toBe(false);
    if (!missing.isSuccess) expect(missing.error).toBeInstanceOf(PromptTemplateNotFoundError);
    const inactive = await fixture({
      template: template(GENERATOR_TYPES.Manual, false),
    }).create.execute(input());
    expect(inactive.isSuccess).toBe(false);
    if (!inactive.isSuccess) expect(inactive.error).toBeInstanceOf(PromptTemplateNotFoundError);
    const incompatible = await fixture({
      template: template(GENERATOR_TYPES.Gemini),
    }).create.execute(input());
    expect(incompatible.isSuccess).toBe(false);
    if (!incompatible.isSuccess) expect(incompatible.error).toBeInstanceOf(InvalidAIValueError);
  });
});

describe('ValidateGeneration coordination', () => {
  it('executes every mandatory component in the required order', async () => {
    const { generationId, target } = await createRequest();
    const validated = await target.validate.execute({ generationId });
    expect(validated).toEqual({
      isSuccess: true,
      value: { generationId, status: 'Validating', version: 3 },
    });
    expect(target.callLog).toEqual([
      'prompt-builder',
      'prompt-validator',
      'context-builder',
      'llm-gateway',
      'response-validator',
      'quality-evaluator',
      'difficulty-evaluator',
      'duplicate-detector',
    ]);
    const request = await target.repository.findById(generationId);
    expect(request?.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'GenerationRequested',
      'GenerationValidated',
    ]);
  });
  it('rejects an invalid prompt before context construction or gateway invocation', async () => {
    const target = fixture({ promptIsValid: false });
    const { generationId } = await createRequest(target);
    const validated = await target.validate.execute({ generationId });
    expect(validated.isSuccess).toBe(true);
    if (validated.isSuccess) expect(validated.value.status).toBe('Rejected');
    expect(target.callLog).toEqual(['prompt-builder', 'prompt-validator']);
    expect((await target.repository.findById(generationId))?.lifecycle).toMatchObject({
      reason: 'InvalidStructure',
    });
  });
  it('records failed response gates but cannot approve them', async () => {
    for (const target of [
      fixture({ responseIsValid: false }),
      fixture({ quality: 70 }),
      fixture({ observedDifficulty: 5 }),
    ]) {
      const { generationId } = await createRequest(target);
      expect((await target.validate.execute({ generationId })).isSuccess).toBe(true);
      const approval = await target.approve.execute({ generationId });
      expect(approval.isSuccess).toBe(false);
      if (!approval.isSuccess) expect(approval.error).toBeInstanceOf(GenerationNotApprovableError);
    }
  });
  it('rejects and persists a gateway component failure without exposing a partial candidate', async () => {
    const target = fixture();
    const { generationId } = await createRequest(target);
    class FailingGateway implements LLMGateway {
      generate(
        _input: LLMGenerationInput,
      ): Promise<ResultType<AIGenerationResult, AIPipelineError>> {
        target.callLog.push('llm-gateway');
        return Promise.resolve(Result.failure(new PipelineComponentError('llm-gateway')));
      }
    }
    const request = await target.repository.findById(generationId);
    expect(request?.status).toBe('Pending');
    const base = {
      clock: new FixedClock(),
      generationRepository: target.repository,
      unitOfWork: target.unitOfWork,
      uuidService: uuid,
    };
    const failing = new ValidateGeneration({
      ...base,
      contextBuilder: new FakeContextBuilder(target.callLog),
      difficultyEvaluator: new FakeDifficultyEvaluator(
        target.callLog,
        value(DifficultyAnalysis.create({ confidence: confidence(), expected: 3, observed: 3 })),
      ),
      duplicateDetector: new FakeDuplicateDetector(
        target.callLog,
        new DuplicateAnalysis(value(SimilarityScore.create(0.1)), confidence()),
      ),
      llmGateway: new FailingGateway(),
      promptBuilder: new FakePromptBuilder(target.callLog, value(PromptText.create('prompt'))),
      promptValidator: new FakePromptValidator(target.callLog, validation()),
      qualityEvaluator: new FakeQualityEvaluator(
        target.callLog,
        new QualityReport(value(QualityScore.create(90)), confidence()),
      ),
      responseValidator: new FakeResponseValidator(target.callLog, validation()),
    });
    const failed = await failing.execute({ generationId });
    expect(failed.isSuccess).toBe(false);
    if (!failed.isSuccess) expect(failed.error).toBeInstanceOf(PipelineComponentError);
    expect((await target.repository.findById(generationId))?.status).toBe('Rejected');
  });
});

describe('approval, rejection and publication use cases', () => {
  it('requires explicit approval before the PublicationGate and publishes afterward', async () => {
    const { generationId, target } = await createRequest();
    await target.validate.execute({ generationId });
    const approved = await target.approve.execute({ generationId });
    expect(approved.isSuccess).toBe(true);
    const published = await target.publish.execute({ generationId });
    expect(published).toEqual({
      isSuccess: true,
      value: { generationId, status: 'Published', version: 5 },
    });
    expect(target.callLog.at(-1)).toBe('publication-gate');
    expect(
      (await target.repository.findById(generationId))?.pendingDomainEvents.map(
        (event) => event.eventName,
      ),
    ).toEqual([
      'GenerationRequested',
      'GenerationValidated',
      'GenerationApproved',
      'GenerationPublished',
    ]);
  });
  it('does not call PublicationGate for a non-accepted generation', async () => {
    const { generationId, target } = await createRequest();
    const response = await target.publish.execute({ generationId });
    expect(response.isSuccess).toBe(false);
    expect(target.callLog).toEqual([]);
  });
  it('keeps an accepted generation unchanged when PublicationGate denies it', async () => {
    const target = fixture({ approvedForPublication: false });
    const { generationId } = await createRequest(target);
    await target.validate.execute({ generationId });
    await target.approve.execute({ generationId });
    const response = await target.publish.execute({ generationId });
    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) expect(response.error).toBeInstanceOf(PublicationDeniedError);
    expect((await target.repository.findById(generationId))?.status).toBe('Accepted');
  });
  it('supports an explicit rejection command without invoking any evaluator', async () => {
    const { generationId, target } = await createRequest();
    const rejected = await target.reject.execute({
      generationId,
      reason: REJECTED_REASONS.UnsafeContent,
    });
    expect(rejected.isSuccess).toBe(true);
    if (rejected.isSuccess) expect(rejected.value.status).toBe('Rejected');
    expect(target.callLog).toEqual([]);
  });
  it.each(['validate', 'approve', 'reject', 'publish'] as const)(
    'returns not-found from %s',
    async (operation) => {
      const target = fixture();
      const generationId = GenerationId.create(uuid.generate());
      const calls = {
        validate: () => target.validate.execute({ generationId }),
        approve: () => target.approve.execute({ generationId }),
        reject: () => target.reject.execute({ generationId, reason: REJECTED_REASONS.Other }),
        publish: () => target.publish.execute({ generationId }),
      };
      const response = await calls[operation]();
      expect(response.isSuccess).toBe(false);
      if (!response.isSuccess) expect(response.error).toBeInstanceOf(GenerationNotFoundError);
    },
  );
});

describe('deterministic test infrastructure', () => {
  it('resolves templates and generations deterministically', async () => {
    const target = fixture();
    const current = template();
    expect((await new FakePromptRepository([current]).findActiveByKey('lesson.theory'))?.key).toBe(
      'lesson.theory',
    );
    const { generationId } = await createRequest(target);
    expect((await target.repository.findById(generationId))?.id.equals(generationId)).toBe(true);
  });
  it('serializes subsequent work even after a rejected callback', async () => {
    const work = new FakeAIPipelineUnitOfWork();
    const log: string[] = [];
    const first = work.execute(async () => {
      log.push('first');
      throw new Error('expected');
    });
    const second = work.execute(() => {
      log.push('second');
      return Promise.resolve(2);
    });
    await expect(first).rejects.toThrow('expected');
    await expect(second).resolves.toBe(2);
    expect(log).toEqual(['first', 'second']);
  });
});
