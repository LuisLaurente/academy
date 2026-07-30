export interface CreateGenerationRequestInput {
  readonly contentId?: string;
  readonly curriculumItemId?: string;
  readonly priority?: string;
  readonly requestId?: string;
  readonly requestType: string;
}

export interface StartGenerationInput {
  readonly jobId?: string;
  readonly requestId: string;
}

export interface CompleteGenerationInput {
  readonly artifactType: string;
  readonly contentPayload: string;
  readonly durationMs?: number;
  readonly estimatedCostUSD?: number;
  readonly modelName?: string;
  readonly promptVersion?: string;
  readonly requestId: string;
  readonly tokensUsed?: number;
}

export interface FailGenerationInput {
  readonly reason: string;
  readonly requestId: string;
}
