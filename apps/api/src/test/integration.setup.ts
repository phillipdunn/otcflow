import { beforeAll, beforeEach, afterAll } from 'vitest';
import type express from 'express';
import type { IntegrationHttpServer } from './integrationHttpServer.js';

export let integrationApp: express.Application;
export let integrationHttpServer: IntegrationHttpServer;

beforeAll(async () => {
  const { prisma } = await import('../db/prisma.js');
  const { createApp } = await import('../app.js');
  const { initUserCache } = await import('../data/user.store.js');
  const { startIntegrationHttpServer } = await import('./integrationHttpServer.js');

  await prisma.$connect();
  await initUserCache();
  integrationApp = createApp();
  integrationHttpServer = await startIntegrationHttpServer(integrationApp);
});

beforeEach(async () => {
  const auditService = await import('../services/audit.service.js');
  const dealRepo = await import('../repositories/deal.repository.js');
  const simulatorService = await import('../services/simulator.service.js');

  await simulatorService.stopSimulator();
  await dealRepo.deleteAllDeals();
  await auditService.clearAllAuditEvents();
});

afterAll(async () => {
  const { prisma } = await import('../db/prisma.js');
  await integrationHttpServer.close();
  await prisma.$disconnect();
});
