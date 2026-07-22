import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { Result as ResultType } from '../../core/result/result.js';
import {
  AIGenerationRequest,
  type GenerationLifecycle,
} from './domain/aggregates/ai-generation-request.js';
import {
  GenerationNotApprovableError,
  InvalidAIValueError,
  InvalidGenerationDateError,
  InvalidGenerationStateError,
  InvalidGenerationVersionError,
} from './domain/errors/ai-pipeline-errors.js';
import {
  AIGenerationResult,
  DifficultyAnalysis,
  DuplicateAnalysis,
  GenerationMetadata,
  GenerationPolicy,
  PromptTemplate,
  QualityReport,
  ValidationReport,
} from './domain/models/generation-models.js';
import {
  GENERATION_STATUSES,
  GENERATOR_TYPES,
  REJECTED_REASONS,
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

const uuid = new CryptoUuidService();
const NOW = new Date('2026-07-21T20:00:00.000Z');
function value<T, E>(result: ResultType<T, E>): T {
  if (!result.isSuccess) throw result.error;
  return result.value;
}
const confidence = (score = 0.95) => value(ConfidenceScore.create(score));
const qualityScore = (score = 90) => value(QualityScore.create(score));
const similarity = (score = 0.1) => value(SimilarityScore.create(score));
const transition = (date = NOW) => ({ eventId: uuid.generate(), occurredAt: date });
function template(
  overrides: Partial<Parameters<typeof PromptTemplate.create>[0]> = {},
): PromptTemplate {
  return value(
    PromptTemplate.create({
      active: true,
      generator: GENERATOR_TYPES.Manual,
      key: 'lesson.theory',
      purpose: 'Generate lesson theory',
      version: 1,
      ...overrides,
    }),
  );
}
function metadata(source = template()): GenerationMetadata {
  return value(
    GenerationMetadata.create({
      generator: GENERATOR_TYPES.Manual,
      maxTokens: value(MaxTokens.create(2_000)),
      modelName: value(ModelName.create('fake-model-v1')),
      temperature: value(Temperature.create(0.2)),
      template: source,
      topP: value(TopP.create(0.9)),
    }),
  );
}
function policy(
  overrides: Partial<Parameters<typeof GenerationPolicy.create>[0]> = {},
): GenerationPolicy {
  return value(
    GenerationPolicy.create({
      maximumSimilarity: similarity(0.3),
      minimumConfidence: confidence(0.8),
      minimumQuality: qualityScore(85),
      targetDifficulty: 3,
      ...overrides,
    }),
  );
}
function report(passed = true, score = 0.95): ValidationReport {
  return value(
    ValidationReport.create({
      confidence: confidence(score),
      findings: passed ? [] : ['Schema mismatch'],
      passed,
    }),
  );
}
function generated(meta = metadata()): AIGenerationResult {
  return value(
    AIGenerationResult.create({
      completedAt: NOW,
      content: '{"theory":"deterministic candidate"}',
      metadata: meta,
    }),
  );
}
function difficulty(observed = 3, score = 0.95): DifficultyAnalysis {
  return value(DifficultyAnalysis.create({ confidence: confidence(score), expected: 3, observed }));
}
function bundle(overrides: Partial<Parameters<AIGenerationRequest['completeValidation']>[0]> = {}) {
  return {
    difficulty: difficulty(),
    duplicate: new DuplicateAnalysis(similarity(), confidence()),
    quality: new QualityReport(qualityScore(), confidence()),
    result: generated(),
    validation: report(),
    ...overrides,
  };
}
function pending(): AIGenerationRequest {
  return AIGenerationRequest.create({
    createdAt: NOW,
    eventId: uuid.generate(),
    id: GenerationId.create(uuid.generate()),
    metadata: metadata(),
    policy: policy(),
    updatedAt: NOW,
  });
}
function validating(overrides: Partial<ReturnType<typeof bundle>> = {}): AIGenerationRequest {
  const request = pending();
  request.startGeneration(value(PromptText.create('deterministic prompt shell')), transition());
  request.completeValidation(bundle(overrides), transition());
  request.clearDomainEvents();
  return request;
}

describe('AI pipeline serialized vocabularies', () => {
  it('defines provider-neutral generators, lifecycle states and rejection reasons', () => {
    expect(Object.values(GENERATOR_TYPES)).toEqual(['FutureLLM', 'Gemini', 'Manual']);
    expect(Object.values(GENERATION_STATUSES)).toEqual([
      'Accepted',
      'Generating',
      'Pending',
      'Published',
      'Rejected',
      'Validating',
    ]);
    expect(Object.values(REJECTED_REASONS)).toContain('UnsafeContent');
    expect(Object.isFrozen(GENERATOR_TYPES)).toBe(true);
  });
});

describe('AI pipeline value objects', () => {
  it('creates immutable value-semantic objects and typed generation identities', () => {
    const raw = uuid.generate();
    const prompt = value(PromptText.create('  stable\r\nprompt  '));
    expect(prompt.value).toBe('stable\nprompt');
    expect(prompt.equals(value(PromptText.create('stable\nprompt')))).toBe(true);
    expect(GenerationId.create(raw).equals(GenerationId.create(raw))).toBe(true);
    expect(Object.isFrozen(prompt)).toBe(true);
  });
  it.each([
    PromptText.create(' '),
    PromptText.create('x'.repeat(100_001)),
    ModelName.create(''),
    ModelName.create('invalid model'),
    Temperature.create(-0.1),
    Temperature.create(2.1),
    TopP.create(0),
    TopP.create(1.1),
    MaxTokens.create(0),
    MaxTokens.create(1_000_001),
    QualityScore.create(-1),
    QualityScore.create(101),
    ConfidenceScore.create(-0.1),
    ConfidenceScore.create(1.1),
    SimilarityScore.create(-0.1),
    SimilarityScore.create(1.1),
  ])('rejects invalid scalar values', (result) => {
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidAIValueError);
  });
  it('accepts inclusive score and sampling boundaries', () => {
    expect(Temperature.create(0).isSuccess).toBe(true);
    expect(Temperature.create(2).isSuccess).toBe(true);
    expect(TopP.create(1).isSuccess).toBe(true);
    expect(QualityScore.create(0).isSuccess).toBe(true);
    expect(ConfidenceScore.create(1).isSuccess).toBe(true);
  });
});

describe('AI pipeline domain models', () => {
  it('models templates without embedding a concrete prompt', () => {
    const current = template({ key: '  lesson.theory  ', purpose: '  Generate   theory ' });
    expect(current).toMatchObject({
      active: true,
      key: 'lesson.theory',
      purpose: 'Generate theory',
      version: 1,
    });
    expect('prompt' in current).toBe(false);
  });
  it.each([
    PromptTemplate.create({
      active: true,
      generator: GENERATOR_TYPES.Manual,
      key: 'Invalid Key',
      purpose: 'Purpose',
      version: 1,
    }),
    PromptTemplate.create({
      active: true,
      generator: GENERATOR_TYPES.Manual,
      key: 'valid.key',
      purpose: '',
      version: 1,
    }),
    PromptTemplate.create({
      active: true,
      generator: GENERATOR_TYPES.Manual,
      key: 'valid.key',
      purpose: 'Purpose',
      version: 0,
    }),
  ])('rejects invalid template metadata', (result) => {
    expect(result.isSuccess).toBe(false);
  });
  it('requires active templates whose generator matches generation metadata', () => {
    expect(
      GenerationMetadata.create({
        generator: GENERATOR_TYPES.Manual,
        maxTokens: value(MaxTokens.create(1)),
        modelName: value(ModelName.create('fake')),
        temperature: value(Temperature.create(0)),
        template: template({ active: false }),
        topP: value(TopP.create(1)),
      }).isSuccess,
    ).toBe(false);
    expect(
      GenerationMetadata.create({
        generator: GENERATOR_TYPES.Gemini,
        maxTokens: value(MaxTokens.create(1)),
        modelName: value(ModelName.create('fake')),
        temperature: value(Temperature.create(0)),
        template: template(),
        topP: value(TopP.create(1)),
      }).isSuccess,
    ).toBe(false);
  });
  it('creates a deterministic policy with mandatory human approval', () => {
    const current = policy();
    expect(current.humanApprovalRequired).toBe(true);
    expect(current.targetDifficulty).toBe(3);
    expect(Object.isFrozen(current)).toBe(true);
    expect(
      GenerationPolicy.create({
        maximumSimilarity: similarity(),
        minimumConfidence: confidence(),
        minimumQuality: qualityScore(),
        targetDifficulty: 6,
      }).isSuccess,
    ).toBe(false);
  });
  it('enforces internally consistent validation reports', () => {
    expect(
      ValidationReport.create({ confidence: confidence(), findings: ['warning'], passed: true })
        .isSuccess,
    ).toBe(false);
    expect(ValidationReport.create({ confidence: confidence(), passed: false }).isSuccess).toBe(
      false,
    );
    expect(
      ValidationReport.create({
        confidence: confidence(),
        findings: ['x'.repeat(501)],
        passed: false,
      }).isSuccess,
    ).toBe(false);
    const combined = ValidationReport.combine(report(), report(false, 0.7));
    expect(combined.passed).toBe(false);
    expect(combined.confidence.value).toBe(0.7);
    expect(combined.findings).toEqual(['Schema mismatch']);
  });
  it('evaluates quality, difficulty, duplicate and confidence independently', () => {
    expect(new QualityReport(qualityScore(84), confidence()).passes(policy())).toBe(false);
    expect(new QualityReport(qualityScore(), confidence(0.7)).passes(policy())).toBe(false);
    expect(new DuplicateAnalysis(similarity(0.4), confidence()).passes(policy())).toBe(false);
    expect(new DuplicateAnalysis(similarity(), confidence(0.7)).passes(policy())).toBe(false);
    expect(difficulty(4).passes(policy())).toBe(false);
    expect(difficulty(3, 0.7).passes(policy())).toBe(false);
    expect(difficulty().passes(policy())).toBe(true);
  });
  it('validates difficulty and generated result boundaries defensively', () => {
    expect(
      DifficultyAnalysis.create({ confidence: confidence(), expected: 0, observed: 3 }).isSuccess,
    ).toBe(false);
    expect(
      DifficultyAnalysis.create({ confidence: confidence(), expected: 3, observed: 6 }).isSuccess,
    ).toBe(false);
    expect(
      AIGenerationResult.create({ completedAt: NOW, content: '', metadata: metadata() }).isSuccess,
    ).toBe(false);
    expect(
      AIGenerationResult.create({
        completedAt: new Date(Number.NaN),
        content: 'value',
        metadata: metadata(),
      }).isSuccess,
    ).toBe(false);
    const result = generated();
    const exposed = result.completedAt;
    exposed.setUTCFullYear(2030);
    expect(result.completedAt).toEqual(NOW);
  });
});

describe('AIGenerationRequest aggregate', () => {
  it('starts Pending and records GenerationRequested', () => {
    const request = pending();
    expect(request.status).toBe('Pending');
    expect(request.aggregateVersion).toBe(1);
    expect(request.pendingDomainEvents[0]?.eventName).toBe('GenerationRequested');
    expect(request.pendingDomainEvents[0]?.payload).toEqual({ templateKey: 'lesson.theory' });
  });
  it('enforces generation then complete validation in order', () => {
    const request = pending();
    expect(
      request.startGeneration(value(PromptText.create('prompt')), transition()).isSuccess,
    ).toBe(true);
    expect(request.status).toBe('Generating');
    expect(request.completeValidation(bundle(), transition()).isSuccess).toBe(true);
    expect(request.status).toBe('Validating');
    expect(request.aggregateVersion).toBe(3);
    expect(request.pendingDomainEvents.at(-1)?.eventName).toBe('GenerationValidated');
  });
  it('approves only after all deterministic gates and then publishes', () => {
    const request = validating();
    expect(request.approve(transition()).isSuccess).toBe(true);
    expect(request.status).toBe('Accepted');
    expect(request.publish(transition()).isSuccess).toBe(true);
    expect(request.status).toBe('Published');
    expect(request.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'GenerationApproved',
      'GenerationPublished',
    ]);
  });
  it.each([
    ['validation', { validation: report(false) }],
    ['validation', { validation: report(true, 0.7) }],
    ['quality', { quality: new QualityReport(qualityScore(80), confidence()) }],
    ['difficulty', { difficulty: difficulty(4) }],
    ['duplicate', { duplicate: new DuplicateAnalysis(similarity(0.8), confidence()) }],
  ] as const)('blocks approval at the %s gate', (gate, override) => {
    const request = validating(override);
    const result = request.approve(transition());
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error).toBeInstanceOf(GenerationNotApprovableError);
      expect(result.error.context).toEqual({ failedGate: gate });
    }
    expect(request.status).toBe('Validating');
  });
  it('supports explicit rejection while preserving the previous state', () => {
    for (const request of [
      pending(),
      (() => {
        const item = pending();
        item.startGeneration(value(PromptText.create('prompt')), transition());
        return item;
      })(),
      validating(),
      (() => {
        const item = validating();
        item.approve(transition());
        return item;
      })(),
    ]) {
      const previous = request.status;
      expect(request.reject(REJECTED_REASONS.Other, transition()).isSuccess).toBe(true);
      expect(request.status).toBe('Rejected');
      expect(request.lifecycle).toMatchObject({ previousStatus: previous, reason: 'Other' });
      expect(request.pendingDomainEvents.at(-1)?.eventName).toBe('GenerationRejected');
    }
  });
  it('rejects attempts to skip or repeat lifecycle stages', () => {
    const pendingRequest = pending();
    const validatingRequest = validating();
    const published = validating();
    published.approve(transition());
    published.publish(transition());
    const rejected = pending();
    rejected.reject(REJECTED_REASONS.Other, transition());
    const results = [
      pendingRequest.completeValidation(bundle(), transition()),
      pendingRequest.approve(transition()),
      pendingRequest.publish(transition()),
      validatingRequest.startGeneration(value(PromptText.create('again')), transition()),
      published.reject(REJECTED_REASONS.Other, transition()),
      rejected.reject(REJECTED_REASONS.Other, transition()),
    ];
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidGenerationStateError);
    }
  });
  it('validates chronology, versions and serialized states during rehydration', () => {
    const base = pending();
    const state = {
      aggregateVersion: 1,
      createdAt: NOW,
      id: base.id,
      lifecycle: { status: GENERATION_STATUSES.Pending } as const,
      metadata: base.metadata,
      policy: base.policy,
      updatedAt: NOW,
    };
    expect(() => AIGenerationRequest.rehydrate({ ...state, aggregateVersion: 0 })).toThrow(
      InvalidGenerationVersionError,
    );
    expect(() =>
      AIGenerationRequest.rehydrate({ ...state, updatedAt: new Date(NOW.getTime() - 1) }),
    ).toThrow(InvalidGenerationDateError);
    expect(() =>
      AIGenerationRequest.rehydrate({
        ...state,
        lifecycle: { status: 'Unknown' } as unknown as GenerationLifecycle,
      }),
    ).toThrow(InvalidGenerationStateError);
    expect(() =>
      base.startGeneration(
        value(PromptText.create('prompt')),
        transition(new Date(NOW.getTime() - 1)),
      ),
    ).toThrow(InvalidGenerationDateError);
  });
  it('returns defensive dates and immutable lifecycle snapshots', () => {
    const request = pending();
    const date = request.createdAt;
    date.setUTCFullYear(2030);
    expect(request.createdAt).toEqual(NOW);
    expect(Object.isFrozen(request.lifecycle)).toBe(true);
  });
});
