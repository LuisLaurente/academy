export interface GenerationPolicy {
  canRequestGeneration(requestType: string): boolean;
  maxAttemptsPerRequest(): number;
}
