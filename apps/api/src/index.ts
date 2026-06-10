import './loadEnv.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { initUserCache } from './data/user.store.js';
import { prisma } from './db/prisma.js';
import { createDealsWebSocketServer } from './ws/dealsWs.js';
import { routeWebSocketUpgrades } from './ws/routeWebSocketUpgrades.js';
import { dealEventBus } from './events/dealEventBus.js';
import { wireDealEventBusToWebSocket } from './events/wireDealEventBusToWebSocket.js';
import { wireDealEventBusToGraphQL } from './graphql/wireDealEventBusToGraphQL.js';
import { createGraphQLSubscriptionServer } from './graphql/attachGraphQLSubscriptions.js';
import { logger } from './observability/logger.js';
import {
  registerGracefulShutdown,
  registerProcessErrorHandlers,
} from './observability/gracefulShutdown.js';

registerProcessErrorHandlers();

const app = createApp();
const port = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);

const dealsWss = createDealsWebSocketServer();
const graphQLWss = createGraphQLSubscriptionServer();
routeWebSocketUpgrades(httpServer, { '/ws/deals': dealsWss, '/graphql': graphQLWss });
wireDealEventBusToWebSocket(dealEventBus);
wireDealEventBusToGraphQL(dealEventBus);

registerGracefulShutdown({ httpServer, dealsWss, graphQLWss });

async function bootstrap(): Promise<void> {
  logger.info('app_starting', { port });

  await prisma.$connect();
  logger.info('database_connected');

  await initUserCache();

  httpServer.listen(port, () => {
    logger.info('app_listening', {
      port,
      httpUrl: `http://localhost:${port}`,
      dealsWebSocket: `ws://localhost:${port}/ws/deals`,
      graphQLHttp: `http://localhost:${port}/graphql`,
      graphQLWebSocket: `ws://localhost:${port}/graphql`,
      healthLive: `http://localhost:${port}/health/live`,
      healthReady: `http://localhost:${port}/health/ready`,
      metrics: `http://localhost:${port}/metrics`,
    });
  });
}

bootstrap().catch((err) => {
  logger.error('app_start_failed', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
