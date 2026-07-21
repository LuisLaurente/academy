import { z } from 'zod';

const nodeEnvironmentSchema = z.enum(['development', 'test', 'production']);
const urlSchema = z.url();
const environmentBooleanSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());
const requiredTrueSchema = z.preprocess(
  (value) => (value === 'true' ? true : value),
  z.literal(true),
);

export const apiEnvironmentSchema = z
  .object({
    NODE_ENV: nodeEnvironmentSchema.default('development'),
    API_PORT: z.coerce.number().int().positive().max(65_535).default(3001),
    CORS_ORIGIN: urlSchema.default('http://localhost:3000'),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: urlSchema,
    BULLMQ_PREFIX: z.string().min(1).default('learning-os'),
    AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().max(86_400).default(900),
    AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(31_536_000)
      .default(2_592_000),
    AUTH_PASSWORD_HASH_ALGORITHM: z.literal('argon2id').default('argon2id'),
    AUTH_PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).max(128).default(12),
    AUTH_COOKIE_ACCESS_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('learning_os_access'),
    AUTH_COOKIE_REFRESH_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('learning_os_refresh'),
    AUTH_COOKIE_HTTP_ONLY: requiredTrueSchema.default(true),
    AUTH_COOKIE_SECURE: environmentBooleanSchema.default(true),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict']).default('lax'),
    AUTH_COOKIE_PATH: z.string().startsWith('/').default('/'),
    AUTH_COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV === 'production' && !environment.AUTH_COOKIE_SECURE) {
      context.addIssue({
        code: 'custom',
        message: 'Authentication cookies must be secure in production.',
        path: ['AUTH_COOKIE_SECURE'],
      });
    }
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
