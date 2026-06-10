import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type express from 'express';
import { createDealsWebSocketServer } from '../ws/dealsWs.js';
import { routeWebSocketUpgrades } from '../ws/routeWebSocketUpgrades.js';
import { dealEventBus } from '../events/dealEventBus.js';
import { wireDealEventBusToWebSocket } from '../events/wireDealEventBusToWebSocket.js';
import { wireDealEventBusToGraphQL } from '../graphql/wireDealEventBusToGraphQL.js';
import { createGraphQLSubscriptionServer } from '../graphql/attachGraphQLSubscriptions.js';

export type IntegrationHttpServer = {
  httpServer: Server;
  baseUrl: string;
  wsDealsUrl: string;
  close: () => Promise<void>;
};

/**
 * Mirrors `index.ts` WebSocket wiring on top of an existing Express app.
 * Used by integration tests that need a real `/ws/deals` upgrade path.
 */
export async function startIntegrationHttpServer(
  app: express.Application
): Promise<IntegrationHttpServer> {
  const httpServer = createServer(app);
  const dealsWss = createDealsWebSocketServer();
  const graphQLWss = createGraphQLSubscriptionServer();
  routeWebSocketUpgrades(httpServer, { '/ws/deals': dealsWss, '/graphql': graphQLWss });
  const unsubWs = wireDealEventBusToWebSocket(dealEventBus);
  const unsubGql = wireDealEventBusToGraphQL(dealEventBus);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    httpServer,
    baseUrl: `http://127.0.0.1:${port}`,
    wsDealsUrl: `ws://127.0.0.1:${port}/ws/deals`,
    close: () =>
      new Promise((resolve, reject) => {
        unsubWs();
        unsubGql();
        httpServer.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
