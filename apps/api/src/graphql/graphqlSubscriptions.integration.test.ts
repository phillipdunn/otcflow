import { afterEach, expect, test } from 'vitest';
import request from 'supertest';
import type { Client } from 'graphql-ws';
import { integrationApp, integrationHttpServer } from '../test/integration.setup.js';
import {
  createGraphQLWsTestClient,
  waitForGraphQLWsConnected,
  waitForNextDealUpdated,
} from '../test/graphqlWsTestClient.js';
import { testBrokerUser, testTraderUser } from '../test/fixtures.js';

let gqlWsClient: Client | undefined;

afterEach(() => {
  gqlWsClient?.dispose();
  gqlWsClient = undefined;
});

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

test('GraphQL dealUpdated subscription receives DEAL_CREATED after createDeal mutation', async () => {
  gqlWsClient = createGraphQLWsTestClient(
    integrationHttpServer.wsGraphQLUrl,
    testBrokerUser.id
  );
  await waitForGraphQLWsConnected(gqlWsClient);

  const subscriptionPromise = waitForNextDealUpdated(gqlWsClient);

  const mutationRes = await gql(
    `
    mutation Create($input: CreateDealInput!) {
      createDeal(input: $input) {
        id
        version
      }
    }
  `,
    {
      input: {
        product: 'IRS',
        counterparty: 'Subscription Counterparty',
        notional: 3_000_000,
        currency: 'USD',
        price: 3.1,
        trader: 'Sub Trader',
        broker: 'Sub Broker',
      },
    },
    { 'x-user-id': testBrokerUser.id }
  );

  expect(mutationRes.status).toBe(200);
  expect(mutationRes.body.errors).toBeUndefined();
  const dealId = mutationRes.body.data.createDeal.id as string;
  expect(mutationRes.body.data.createDeal.version).toBe(1);

  const subscriptionPayload = await subscriptionPromise;
  expect(subscriptionPayload.type).toBe('DEAL_CREATED');
  expect(subscriptionPayload.deal.id).toBe(dealId);
  expect(subscriptionPayload.deal.version).toBe(1);
  // GraphQL `DealDomainEvent` exposes domain shape only — no stream `sequenceNumber`.
  expect(subscriptionPayload).not.toHaveProperty('sequenceNumber');

  const auditRes = await gql(
    `
    query Events($dealId: ID!) {
      dealEvents(dealId: $dealId) {
        type
        version
        user {
          id
        }
      }
    }
  `,
    { dealId }
  );

  expect(auditRes.body.data.dealEvents[0].type).toBe('DEAL_CREATED');
  expect(auditRes.body.data.dealEvents[0].version).toBe(1);
  expect(auditRes.body.data.dealEvents[0].user.id).toBe(testBrokerUser.id);
});

test('GraphQL dealUpdated subscription receives DEAL_STATUS_CHANGED after updateDealStatus mutation', async () => {
  gqlWsClient = createGraphQLWsTestClient(
    integrationHttpServer.wsGraphQLUrl,
    testTraderUser.id
  );
  await waitForGraphQLWsConnected(gqlWsClient);

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
        product: 'OIS',
        counterparty: 'Status Sub Counterparty',
        notional: 1_500_000,
        currency: 'EUR',
        price: 2.75,
        trader: 'Status Trader',
        broker: 'Status Broker',
      },
    },
    { 'x-user-id': testTraderUser.id }
  );

  const dealId = created.body.data.createDeal.id as string;

  const subscriptionPromise = waitForNextDealUpdated(gqlWsClient);

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

  const subscriptionPayload = await subscriptionPromise;
  expect(subscriptionPayload.type).toBe('DEAL_STATUS_CHANGED');
  expect(subscriptionPayload.deal.id).toBe(dealId);
  expect(subscriptionPayload.deal.version).toBe(2);
  expect(subscriptionPayload.deal.status).toBe('PENDING');

  const auditRes = await gql(
    `
    query Events($dealId: ID!) {
      dealEvents(dealId: $dealId) {
        type
        version
        user {
          id
        }
      }
    }
  `,
    { dealId }
  );

  const statusAudit = auditRes.body.data.dealEvents.find(
    (e: { type: string }) => e.type === 'DEAL_STATUS_CHANGED'
  );
  expect(statusAudit).toBeDefined();
  expect(statusAudit.version).toBe(2);
  expect(statusAudit.user.id).toBe(testBrokerUser.id);
});
