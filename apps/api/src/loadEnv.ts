import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Load `apps/api/.env` before Prisma client initializes (tsx does not load it automatically). */
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(apiRoot, '.env') });
