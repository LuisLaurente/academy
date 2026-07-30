export interface StartLearningWorkflowInput {
  readonly curriculumItemId: string;
  readonly flowId?: string;
  readonly studentId: string;
}

export interface ExecuteLearningStepInput {
  readonly flowId: string;
  readonly payload?: {
    readonly exerciseId?: string;
    readonly responsePayload?: string;
    readonly score?: number;
  };
}

export interface CompleteLearningWorkflowInput {
  readonly completedAt?: Date;
  readonly flowId: string;
  readonly summary?: string;
}

export interface FailLearningWorkflowInput {
  readonly flowId: string;
  readonly reason: string;
}
