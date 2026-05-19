import { Router } from 'express';
import { HealthResponseSchema } from '@otcflow/shared';
import { prisma } from '../db/prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  const payload = HealthResponseSchema.parse({
    status: 'ok',
    service: 'otcflow-api',
  });
  res.json(payload);
});
