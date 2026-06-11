import express from 'express';
import { afterEach, expect, test, vi } from 'vitest';
import request from 'supertest';
import { healthRouter } from './health.routes.js';
import * as dbHealth from '../observability/dbHealth.js';

function createHealthTestApp(): express.Application {
  const app = express();
  app.use((req, _res, next) => {
    req.requestId = 'test-request-id';
    next();
  });
  app.use(healthRouter);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('GET /health/live returns 200 without database check', async () => {
  const res = await request(createHealthTestApp()).get('/health/live').expect(200);

  expect(res.body).toMatchObject({
    status: 'ok',
    check: 'live',
    service: 'otcflow-api',
  });
});

test('GET /health/ready returns 503 when database check fails', async () => {
  vi.spyOn(dbHealth, 'isDatabaseReady').mockResolvedValue(false);

  const res = await request(createHealthTestApp()).get('/health/ready').expect(503);

  expect(res.body).toMatchObject({
    status: 'unavailable',
    check: 'ready',
    service: 'otcflow-api',
    requestId: 'test-request-id',
  });
});

test('GET /health returns 503 when database check fails', async () => {
  vi.spyOn(dbHealth, 'isDatabaseReady').mockResolvedValue(false);

  const res = await request(createHealthTestApp()).get('/health').expect(503);

  expect(res.body.status).toBe('unavailable');
  expect(res.body.requestId).toBe('test-request-id');
});
