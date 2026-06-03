import { expect, test } from 'vitest';
import request from 'supertest';
import { integrationApp } from '../test/integration.setup.js';

test('GET /health/live returns 200 without requiring database semantics', async () => {
  const res = await request(integrationApp).get('/health/live').expect(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.check).toBe('live');
  expect(res.headers['x-request-id']).toBeDefined();
});

test('GET /health/ready returns 200 when Postgres is up', async () => {
  const res = await request(integrationApp).get('/health/ready').expect(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.check).toBe('ready');
  expect(res.body.requestId).toBe(res.headers['x-request-id']);
});

test('GET /health returns ok payload when database is ready', async () => {
  const res = await request(integrationApp).get('/health').expect(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.service).toBe('otcflow-api');
  expect(res.body.requestId).toBeDefined();
});

test('GET /metrics returns operational snapshot', async () => {
  await request(integrationApp).get('/health').expect(200);

  const res = await request(integrationApp).get('/metrics').expect(200);

  expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  expect(typeof res.body.totalRequests).toBe('number');
  expect(res.body.requestsByRoute).toBeTypeOf('object');
  expect(typeof res.body.errorCount).toBe('number');
  expect(typeof res.body.activeWebSocketClients).toBe('number');
  expect(res.body.simulator).toMatchObject({
    running: expect.any(Boolean),
    dealCount: expect.any(Number),
  });
});

test('responses include X-Request-Id header', async () => {
  const res = await request(integrationApp)
    .get('/deals')
    .set('X-Request-Id', 'test-correlation-id-123')
    .expect(200);

  expect(res.headers['x-request-id']).toBe('test-correlation-id-123');
});
