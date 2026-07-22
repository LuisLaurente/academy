export const GENERATOR_TYPES = Object.freeze({
  FutureLLM: 'FutureLLM',
  Gemini: 'Gemini',
  Manual: 'Manual',
} as const);

export type GeneratorType = (typeof GENERATOR_TYPES)[keyof typeof GENERATOR_TYPES];

export const GENERATION_STATUSES = Object.freeze({
  Accepted: 'Accepted',
  Generating: 'Generating',
  Pending: 'Pending',
  Published: 'Published',
  Rejected: 'Rejected',
  Validating: 'Validating',
} as const);

export type GenerationStatus = (typeof GENERATION_STATUSES)[keyof typeof GENERATION_STATUSES];

export const REJECTED_REASONS = Object.freeze({
  Duplicate: 'Duplicate',
  Hallucination: 'Hallucination',
  InvalidStructure: 'InvalidStructure',
  LowQuality: 'LowQuality',
  Other: 'Other',
  UnsafeContent: 'UnsafeContent',
  WrongDifficulty: 'WrongDifficulty',
} as const);

export type RejectedReason = (typeof REJECTED_REASONS)[keyof typeof REJECTED_REASONS];
