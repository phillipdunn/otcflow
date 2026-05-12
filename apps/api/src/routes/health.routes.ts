import { Router } from 'express';
import { HealthResponseSchema } from '@otcflow/shared';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const payload = HealthResponseSchema.parse({
    status: 'ok',
    service: 'otcflow-api',
  });
  res.json(payload);
});
