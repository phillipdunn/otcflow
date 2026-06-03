import { Router } from 'express';
import { collectMetrics } from '../observability/metrics.js';

export const metricsRouter = Router();

metricsRouter.get('/metrics', async (_req, res) => {
  const snapshot = await collectMetrics();
  res.status(200).json(snapshot);
});
