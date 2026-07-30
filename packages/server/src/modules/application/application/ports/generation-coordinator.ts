export interface GenerationCoordinatorResult {
  readonly contentPayload: string;
  readonly requestId: string;
  readonly status: string;
}

export interface GenerationCoordinator {
  requestContentGeneration(
    curriculumItemId: string,
    requestType: string,
  ): Promise<GenerationCoordinatorResult>;
}
