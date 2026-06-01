import { expect, test } from 'vitest';
import request from 'supertest';
import type { AuditEvent, Deal } from '@otcflow/shared';
import { integrationApp } from '../test/integration.setup.js';
import { testBrokerUser, testTraderUser, validCreateDealBody } from '../test/fixtures.js';

test('GET /deals returns an empty list when no deals exist', async () => {
  const res = await request(integrationApp).get('/deals').expect(200);
  expect(res.body).toEqual([]);
});

test('GET /deals returns persisted deals newest first', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const res = await request(integrationApp).get('/deals').expect(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].id).toBe(created.body.id);
});

test('POST /deals creates deal at version 1 with DEAL_CREATED audit for acting user', async () => {
  const res = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testBrokerUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const deal = res.body as Deal;
  expect(deal.version).toBe(1);
  expect(deal.counterparty).toBe(validCreateDealBody.counterparty);

  const eventsRes = await request(integrationApp).get(`/deals/${deal.id}/events`).expect(200);
  const events = eventsRes.body as AuditEvent[];
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('DEAL_CREATED');
  expect(events[0].user.id).toBe(testBrokerUser.id);
  expect(events[0].user.name).toBe(testBrokerUser.name);
  expect(events[0].version).toBe(1);
});

test('POST /deals returns 400 for invalid input', async () => {
  const res = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send({ ...validCreateDealBody, counterparty: '', notional: -1 })
    .expect(400);

  expect(res.body.error).toBe('Validation failed');
});

test('PATCH /deals/:id/status increments version and records status-change audit for acting user', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const patchRes = await request(integrationApp)
    .patch(`/deals/${created.body.id}/status`)
    .set('x-user-id', testBrokerUser.id)
    .send({ status: 'PENDING' })
    .expect(200);

  expect(patchRes.body.version).toBe(2);
  expect(patchRes.body.status).toBe('PENDING');

  const eventsRes = await request(integrationApp).get(`/deals/${created.body.id}/events`).expect(200);
  const events = eventsRes.body as AuditEvent[];
  const statusEvent = events.find((e) => e.type === 'DEAL_STATUS_CHANGED');
  expect(statusEvent).toBeDefined();
  expect(statusEvent!.user.id).toBe(testBrokerUser.id);
  expect(statusEvent!.previousValue).toBe('NEW');
  expect(statusEvent!.newValue).toBe('PENDING');
  expect(statusEvent!.version).toBe(2);
});

test('PATCH /deals/:id/status returns 404 for an unknown deal id', async () => {
  const res = await request(integrationApp)
    .patch('/deals/00000000-0000-4000-8000-000000000000/status')
    .set('x-user-id', testTraderUser.id)
    .send({ status: 'BOOKED' })
    .expect(404);

  expect(res.body.error).toBe('Deal not found');
});

test('PATCH /deals/:id/status returns 400 for an invalid status value', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const res = await request(integrationApp)
    .patch(`/deals/${created.body.id}/status`)
    .set('x-user-id', testTraderUser.id)
    .send({ status: 'NOT_A_STATUS' })
    .expect(400);

  expect(res.body.error).toBe('Validation failed');
});

test('GET /deals/:id/events returns audit events newest first', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  await request(integrationApp)
    .patch(`/deals/${created.body.id}/status`)
    .set('x-user-id', testBrokerUser.id)
    .send({ status: 'MATCHED' })
    .expect(200);

  const res = await request(integrationApp).get(`/deals/${created.body.id}/events`).expect(200);
  const events = res.body as AuditEvent[];
  expect(events.length).toBeGreaterThanOrEqual(2);
  expect(events[0].type).toBe('DEAL_STATUS_CHANGED');
  expect(events[1].type).toBe('DEAL_CREATED');
});

test('GET /deals/:id/events returns 404 when the deal does not exist', async () => {
  await request(integrationApp)
    .get('/deals/00000000-0000-4000-8000-000000000000/events')
    .expect(404);
});
