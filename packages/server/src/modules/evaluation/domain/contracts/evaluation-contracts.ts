export interface EvaluationResultSnapshot {
  readonly evaluatedAt: Date;
  readonly passed: boolean;
  readonly score: number;
}
