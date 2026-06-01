import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root `.env` (from `docker.env.example`) may set POSTGRES_HOST_PORT for Compose. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
config({ path: resolve(repoRoot, '.env') });

const host = process.env.TEST_DATABASE_HOST ?? '127.0.0.1';
const port = process.env.POSTGRES_HOST_PORT ?? '5433';
const user = process.env.POSTGRES_USER ?? 'postgres';
const password = process.env.POSTGRES_PASSWORD ?? 'postgres';
const database = process.env.POSTGRES_DB ?? 'otcflow';

/** Must match `docker compose` Postgres publish port before Prisma initializes. */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://${user}:${password}@${host}:${port}/${database}`;
