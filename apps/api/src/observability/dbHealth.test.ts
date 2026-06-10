import { afterEach, expect, test, vi } from 'vitest';
import { prisma } from '../db/prisma.js';
import { isDatabaseReady } from './dbHealth.js';

afterEach(() => {
  vi.restoreAllMocks();
});

test('isDatabaseReady returns true when SELECT 1 succeeds', async () => {
  vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

  await expect(isDatabaseReady()).resolves.toBe(true);
});

test('isDatabaseReady returns false when SELECT 1 throws', async () => {
  vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('connection refused'));

  await expect(isDatabaseReady()).resolves.toBe(false);
});
