import { expect, test } from 'vitest';
import request from 'supertest';
import WebSocket from 'ws';
import { DealEventSchema, type DealEvent } from '@otcflow/shared';
import { integrationApp, integrationHttpServer } from '../test/integration.setup.js';
import { testTraderUser, validCreateDealBody } from '../test/fixtures.js';

function waitForNextMessage(ws: WebSocket, timeoutMs = 5_000): Promise<DealEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for WebSocket message')), timeoutMs);
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(DealEventSchema.parse(JSON.parse(data.toString())));
    });
  });
}

test('WebSocket client receives DEAL_CREATED after POST /deals', async () => {
  const ws = new WebSocket(integrationHttpServer.wsDealsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });

  const eventPromise = waitForNextMessage(ws);

  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const event = await eventPromise;
  expect(event.type).toBe('DEAL_CREATED');
  expect(event.sequenceNumber).toBeGreaterThan(0);
  expect(event.deal.id).toBe(created.body.id);
  expect(event.deal.version).toBe(1);

  ws.close();
});

test('WebSocket client receives DEAL_STATUS_CHANGED after PATCH /deals/:id/status', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const ws = new WebSocket(integrationHttpServer.wsDealsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });

  const eventPromise = waitForNextMessage(ws);

  await request(integrationApp)
    .patch(`/deals/${created.body.id}/status`)
    .set('x-user-id', testTraderUser.id)
    .send({ status: 'PENDING' })
    .expect(200);

  const event = await eventPromise;
  expect(event.type).toBe('DEAL_STATUS_CHANGED');
  expect(event.deal.id).toBe(created.body.id);
  expect(event.deal.status).toBe('PENDING');
  expect(event.deal.version).toBe(2);

  ws.close();
});
