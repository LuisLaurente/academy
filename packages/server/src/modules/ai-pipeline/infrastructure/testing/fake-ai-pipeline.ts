import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type { AIGenerationRequest } from '../../domain/aggregates/ai-generation-request.js';
import {
  PublicationDeniedError,
  type AIPipelineError,
} from '../../domain/errors/ai-pipeline-errors.js';
import type {
  AIGenerationResult,
  DifficultyAnalysis,
  DuplicateAnalysis,
  PromptTemplate,
  QualityReport,
  ValidationReport,
} from '../../domain/models/generation-models.js';
import type {
  GenerationId,
  PromptText,
} from '../../domain/value-objects/ai-pipeline-value-objects.js';
import type {
  ContextBuilder,
  DifficultyEvaluator,
  DuplicateDetector,
  GenerationContext,
  GenerationRepository,
  LLMGateway,
  LLMGenerationInput,
  PromptBuilder,
  PromptRepository,
  PromptValidator,
  PublicationGate,
  QualityEvaluator,
  ResponseValidator,
} from '../../application/ports/ai-pipeline-ports.js';

export type PipelineCall =
  | 'context-builder'
  | 'difficulty-evaluator'
  | 'duplicate-detector'
  | 'llm-gateway'
  | 'prompt-builder'
  | 'prompt-validator'
  | 'publication-gate'
  | 'quality-evaluator'
  | 'response-validator';
export type PipelineCallLog = PipelineCall[];

export class InMemoryGenerationRepository implements GenerationRepository {
  readonly #requests = new Map<string, AIGenerationRequest>();
  findById(id: GenerationId): Promise<AIGenerationRequest | undefined> {
    return Promise.resolve(this.#requests.get(id.toString()));
  }
  save(request: AIGenerationRequest): Promise<void> {
    this.#requests.set(request.id.toString(), request);
    return Promise.resolve();
  }
  get size(): number {
    return this.#requests.size;
  }
}

export class FakePromptRepository implements PromptRepository {
  readonly #templates = new Map<string, PromptTemplate>();
  constructor(templates: readonly PromptTemplate[] = []) {
    for (const template of templates) this.#templates.set(template.key, template);
  }
  findActiveByKey(key: string): Promise<PromptTemplate | undefined> {
    const template = this.#templates.get(key.trim());
    return Promise.resolve(template?.active === true ? template : undefined);
  }
}

export class FakeAIPipelineUnitOfWork implements UnitOfWork {
  #pending: Promise<void> = Promise.resolve();
  execute<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    const execution = this.#pending.then(work, work);
    this.#pending = execution.then(
      () => undefined,
      () => undefined,
    );
    return execution;
  }
}

export class FakePromptBuilder implements PromptBuilder {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly prompt: PromptText,
  ) {}
  build(
    _request: AIGenerationRequest,
    _template: PromptTemplate,
  ): Promise<ResultType<PromptText, AIPipelineError>> {
    this.log.push('prompt-builder');
    return Promise.resolve(Result.success(this.prompt));
  }
}
export class FakePromptValidator implements PromptValidator {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly report: ValidationReport,
  ) {}
  validate(_prompt: PromptText): Promise<ResultType<ValidationReport, AIPipelineError>> {
    this.log.push('prompt-validator');
    return Promise.resolve(Result.success(this.report));
  }
}
export class FakeContextBuilder implements ContextBuilder {
  readonly #context: GenerationContext;
  constructor(
    private readonly log: PipelineCallLog,
    context: GenerationContext = { values: { source: 'deterministic-test-context', version: 1 } },
  ) {
    this.#context = Object.freeze({ values: Object.freeze({ ...context.values }) });
  }
  build(_request: AIGenerationRequest): Promise<ResultType<GenerationContext, AIPipelineError>> {
    this.log.push('context-builder');
    return Promise.resolve(Result.success(this.#context));
  }
}
export class FakeLLMGateway implements LLMGateway {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly result: AIGenerationResult,
  ) {}
  generate(_input: LLMGenerationInput): Promise<ResultType<AIGenerationResult, AIPipelineError>> {
    this.log.push('llm-gateway');
    return Promise.resolve(Result.success(this.result));
  }
}
export class FakeResponseValidator implements ResponseValidator {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly report: ValidationReport,
  ) {}
  validate(_result: AIGenerationResult): Promise<ResultType<ValidationReport, AIPipelineError>> {
    this.log.push('response-validator');
    return Promise.resolve(Result.success(this.report));
  }
}
export class FakeQualityEvaluator implements QualityEvaluator {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly report: QualityReport,
  ) {}
  evaluate(_result: AIGenerationResult): Promise<ResultType<QualityReport, AIPipelineError>> {
    this.log.push('quality-evaluator');
    return Promise.resolve(Result.success(this.report));
  }
}
export class FakeDifficultyEvaluator implements DifficultyEvaluator {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly analysis: DifficultyAnalysis,
  ) {}
  evaluate(
    _result: AIGenerationResult,
    _expectedDifficulty: number,
  ): Promise<ResultType<DifficultyAnalysis, AIPipelineError>> {
    this.log.push('difficulty-evaluator');
    return Promise.resolve(Result.success(this.analysis));
  }
}
export class FakeDuplicateDetector implements DuplicateDetector {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly analysis: DuplicateAnalysis,
  ) {}
  analyze(_result: AIGenerationResult): Promise<ResultType<DuplicateAnalysis, AIPipelineError>> {
    this.log.push('duplicate-detector');
    return Promise.resolve(Result.success(this.analysis));
  }
}
export class FakePublicationGate implements PublicationGate {
  constructor(
    private readonly log: PipelineCallLog,
    private readonly approved = true,
  ) {}
  publish(_request: AIGenerationRequest): Promise<ResultType<void, AIPipelineError>> {
    this.log.push('publication-gate');
    return Promise.resolve(
      this.approved ? Result.success(undefined) : Result.failure(new PublicationDeniedError()),
    );
  }
}
