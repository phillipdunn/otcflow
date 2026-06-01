import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api-integration',
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['src/test/setIntegrationDatabaseUrl.ts', 'src/test/integration.setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
