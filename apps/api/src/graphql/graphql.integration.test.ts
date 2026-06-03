import { expect, test } from 'vitest';
import request from 'supertest';
import { integrationApp } from '../test/integration.setup.js';
import { testBrokerUser, testTraderUser, validCreateDealBody } from '../test/fixtures.js';

async function gql(
  query: string,
  variables?: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return request(integrationApp)
    .post('/graphql')
    .set(headers)
    .send({ query, variables });
}

test('GraphQL deals query returns persisted deals', async () => {
  await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const res = await gql(`
    query {
      deals {
        id
        counterparty
        version
      }
    }
  `);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.deals.length).toBeGreaterThanOrEqual(1);
});

test('GraphQL deal query returns one deal by id', async () => {
  const created = await request(integrationApp)
    .post('/deals')
    .set('x-user-id', testTraderUser.id)
    .send(validCreateDealBody)
    .expect(201);

  const res = await gql(
    `
    query DealById($id: ID!) {
      deal(id: $id) {
        id
        counterparty
      }
    }
  `,
    { id: created.body.id }
  );

  expect(res.body.data.deal.id).toBe(created.body.id);
  expect(res.body.data.deal.counterparty).toBe(validCreateDealBody.counterparty);
});

test('GraphQL createDeal mutation persists deal and audit for acting user', async () => {
  const res = await gql(
    `
    mutation Create($input: CreateDealInput!) {
      createDeal(input: $input) {
        id
        version
        status
      }
    }
  `,
    {
      input: {
        product: 'IRS',
        counterparty: 'GraphQL Bank',
        notional: 2_000_000,
        currency: 'USD',
        price: 3.25,
        trader: 'GQL Trader',
        broker: 'GQL Broker',
      },
    },
    { 'x-user-id': testBrokerUser.id }
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.createDeal.version).toBe(1);

  const eventsRes = await gql(
    `
    query Events($dealId: ID!) {
      dealEvents(dealId: $dealId) {
        type
        user {
          id
          name
        }
      }
    }
  `,
    { dealId: res.body.data.createDeal.id }
  );

  expect(eventsRes.body.data.dealEvents[0].type).toBe('DEAL_CREATED');
  expect(eventsRes.body.data.dealEvents[0].user.id).toBe(testBrokerUser.id);
});

test('GraphQL updateDealStatus mutation increments version', async () => {
  const created = await gql(
    `
    mutation Create($input: CreateDealInput!) {
      createDeal(input: $input) {
        id
      }
    }
  `,
    {
      input: {
        product: 'IRS',
        counterparty: 'Status GQL',
        notional: 1_000_000,
        currency: 'USD',
        price: 3.0,
        trader: 'T',
        broker: 'B',
      },
    },
    { 'x-user-id': testTraderUser.id }
  );

  const dealId = created.body.data.createDeal.id;

  const patchRes = await gql(
    `
    mutation Patch($id: ID!, $status: DealStatus!) {
      updateDealStatus(id: $id, status: $status) {
        id
        status
        version
      }
    }
  `,
    { id: dealId, status: 'PENDING' },
    { 'x-user-id': testBrokerUser.id }
  );

  expect(patchRes.body.data.updateDealStatus.version).toBe(2);
  expect(patchRes.body.data.updateDealStatus.status).toBe('PENDING');
});

test('GraphQL deal query returns error for unknown id', async () => {
  const res = await gql(
    `
    query DealById($id: ID!) {
      deal(id: $id) {
        id
      }
    }
  `,
    { id: '00000000-0000-4000-8000-000000000000' }
  );

  expect(res.body.errors?.[0]?.message).toBe('Deal not found');
});
