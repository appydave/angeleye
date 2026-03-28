import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// process.cwd() is server/ when nodemon runs; load .env from monorepo root
// override: true ensures .env always wins over any ambient shell PORT/env vars
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: true });

const envSchema = z.object({
  // TODO: Update defaults for your project
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5051),
  CLIENT_URL: z.string().default('http://localhost:5050'),
  GIT_SYNC_POLL_MS: z.coerce.number().default(120_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/**
 * Validated server environment configuration loaded from .env via Zod.
 * Includes NODE_ENV, PORT, CLIENT_URL, and derived boolean flags (isDevelopment, isProduction, isTest).
 */
export const env = {
  ...parsed.data,
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
};
