import { Router } from 'express';
import { HealthResponseSchema } from '@otcflow/shared';
import { isDatabaseReady } from '../observability/dbHealth.js';

export const healthRouter = Router();

/** Process is up (no dependency checks). */
healthRouter.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    check: 'live',
    service: 'otcflow-api',
  });
});

/** Ready to serve traffic — Postgres must respond. */
healthRouter.get('/health/ready', async (req, res) => {
  const ready = await isDatabaseReady();
  const body = {
    status: ready ? ('ok' as const) : ('unavailable' as const),
    check: 'ready',
    service: 'otcflow-api',
    requestId: req.requestId,
  };
  res.status(ready ? 200 : 503).json(body);
});

/**
 * Legacy health — same readiness semantics as `/health/ready` for existing clients.
 * Returns shared `HealthResponseSchema` shape when ready.
 */
healthRouter.get('/health', async (req, res) => {
  const ready = await isDatabaseReady();
  if (!ready) {
    res.status(503).json({
      status: 'unavailable',
      service: 'otcflow-api',
      requestId: req.requestId,
    });
    return;
  }
  const payload = HealthResponseSchema.parse({
    status: 'ok',
    service: 'otcflow-api',
  });
  res.status(200).json({ ...payload, requestId: req.requestId });
});
