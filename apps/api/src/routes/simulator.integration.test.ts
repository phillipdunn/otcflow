import { expect, test } from 'vitest';
import request from 'supertest';
import type { SimulatorStatus } from '@otcflow/shared';
import { SIMULATOR_DEAL_COUNT_MIN } from '@otcflow/shared';
import { integrationApp } from '../test/integration.setup.js';
import { testTraderUser, validCreateDealBody } from '../test/fixtures.js';

async function getStatus(): Promise<SimulatorStatus> {
  const res = await request(integrationApp).get('/simulator/status').expect(200);
  return res.body as SimulatorStatus;
}

test('GET /simulator/status returns idle snapshot when stopped', async () => {
  const status = await getStatus();
  expect(status.running).toBe(false);
  expect(status.dealCount).toBe(0);
  expect(status.eventsEmitted).toBe(0);
  expect(status.streamEpoch).toBeGreaterThanOrEqual(0);
});

test('POST /simulator/start sets running and accepts intervalMs', async () => {
  const res = await request(integrationApp)
    .post('/simulator/start')
    .send({ intervalMs: 200 })
    .expect(200);

  const status = res.body as SimulatorStatus;
  expect(status.running).toBe(true);
  expect(status.intervalMs).toBe(200);

  await request(integrationApp).post('/simulator/stop').expect(200);
});

test('POST /simulator/stop clears running flag', async () => {
  await request(integrationApp).post('/simulator/start').send({ intervalMs: 500 }).expect(200);

  const stopped = await request(integrationApp).post('/simulator/stop').expect(200);
  expect((stopped.body as SimulatorStatus).running).toBe(false);
  expect(await getStatus()).toMatchObject({ running: false });
});

test('POST /simulator/reset seeds deals and DEAL_CREATED audit rows', async () => {
  const beforeEpoch = (await getStatus()).streamEpoch;

  const res = await request(integrationApp)
    .post('/simulator/reset')
    .send({ dealCount: SIMULATOR_DEAL_COUNT_MIN })
    .expect(200);

  const status = res.body as SimulatorStatus;
  expect(status.running).toBe(false);
  expect(status.dealCount).toBe(SIMULATOR_DEAL_COUNT_MIN);
  expect(status.configuredDealCount).toBe(SIMULATOR_DEAL_COUNT_MIN);
  expect(status.eventsEmitted).toBe(0);
  expect(status.lastSequenceNumber).toBe(0);
  expect(status.streamEpoch).toBe(beforeEpoch + 1);

  const dealsRes = await request(integrationApp).get('/deals').expect(200);
  expect(dealsRes.body).toHaveLength(SIMULATOR_DEAL_COUNT_MIN);

  const sampleDealId = dealsRes.body[0].id as string;
  const auditRes = await request(integrationApp).get(`/deals/${sampleDealId}/events`).expect(200);
  expect(auditRes.body).toHaveLength(1);
  expect(auditRes.body[0].type).toBe('DEAL_CREATED');
});

test('running simulator eventually emits domain events', async () => {
  await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const startRes = await request(integrationApp)
    .post('/simulator/start')
    .send({ intervalMs: 50 })
    .expect(200);
  const startEmitted = (startRes.body as SimulatorStatus).eventsEmitted;

  const deadline = Date.now() + 8_000;
  let latest = startEmitted;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    latest = (await getStatus()).eventsEmitted;
    if (latest > startEmitted) break;
  }

  await request(integrationApp).post('/simulator/stop').expect(200);

  expect(latest).toBeGreaterThan(startEmitted);
}, 15_000);
