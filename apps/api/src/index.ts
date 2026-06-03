import './loadEnv.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { initUserCache } from './data/user.store.js';
import { prisma } from './db/prisma.js';
import { attachDealsWebSocket } from './ws/dealsWs.js';
import { dealEventBus } from './events/dealEventBus.js';
import { wireDealEventBusToWebSocket } from './events/wireDealEventBusToWebSocket.js';
import { wireDealEventBusToGraphQL } from './graphql/wireDealEventBusToGraphQL.js';
import { attachGraphQLSubscriptions } from './graphql/attachGraphQLSubscriptions.js';

const app = createApp();
const port = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);

attachDealsWebSocket(httpServer);
attachGraphQLSubscriptions(httpServer);
wireDealEventBusToWebSocket(dealEventBus);
wireDealEventBusToGraphQL(dealEventBus);

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  await initUserCache();

  httpServer.listen(port, () => {
    console.log(`OTCFlow API listening on http://localhost:${port}`);
    console.log(`Deal events WebSocket: ws://localhost:${port}/ws/deals`);
    console.log(`GraphQL HTTP: http://localhost:${port}/graphql`);
    console.log(`GraphQL subscriptions: ws://localhost:${port}/graphql`);
    console.log('PostgreSQL connected (Prisma)');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  void prisma.$disconnect().finally(() => process.exit(0));
});
process.on('SIGTERM', () => {
  void prisma.$disconnect().finally(() => process.exit(0));
});
