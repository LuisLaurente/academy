export interface StartSessionInput {
  readonly items?: readonly { readonly itemId: string; readonly itemType: string }[];
  readonly recommendationSetId?: string;
  readonly sessionId?: string;
  readonly studentId: string;
}

export interface CompleteSessionItemInput {
  readonly completedAt?: Date;
  readonly score?: number;
  readonly sessionId: string;
}

export interface SkipSessionItemInput {
  readonly sessionId: string;
  readonly skippedAt?: Date;
}

export interface FinishSessionInput {
  readonly finishedAt?: Date;
  readonly sessionId: string;
}
