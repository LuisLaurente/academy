import { z } from 'zod';

const nodeEnvironmentSchema = z.enum(['development', 'test', 'production']);
const urlSchema = z.url();

export const apiEnvironmentSchema = z.object({
  NODE_ENV: nodeEnvironmentSchema.default('development'),
  API_PORT: z.coerce.number().int().positive().max(65_535).default(3001),
  CORS_ORIGIN: urlSchema.default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: urlSchema,
  BULLMQ_PREFIX: z.string().min(1).default('learning-os'),
});

export const webEnvironmentSchema = z.object({
  NODE_ENV: nodeEnvironmentSchema.default('development'),
  NEXT_PUBLIC_API_URL: urlSchema.default('http://localhost:3001'),
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
export type WebEnvironment = z.infer<typeof webEnvironmentSchema>;

export function validateApiEnvironment(environment: Record<string, unknown>): ApiEnvironment {
  return apiEnvironmentSchema.parse(environment);
}

export function validateWebEnvironment(environment: Record<string, unknown>): WebEnvironment {
  return webEnvironmentSchema.parse(environment);
}
