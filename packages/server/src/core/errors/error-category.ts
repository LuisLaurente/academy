export const ERROR_CATEGORIES = [
  'validation',
  'domain-conflict',
  'authorization',
  'not-found',
  'concurrency',
  'dependency-transient',
  'dependency-permanent',
  'security',
  'invariant',
  'fatal-startup',
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export type ErrorContextValue = boolean | number | string | null;
export type ErrorContext = Readonly<Record<string, ErrorContextValue>>;
