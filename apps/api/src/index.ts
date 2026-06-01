import './loadEnv.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { initUserCache } from './data/user.store.js';
import { prisma } from './db/prisma.js';
import { attachDealsWebSocket } from './ws/dealsWs.js';

const app = createApp();
const port = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);

attachDealsWebSocket(httpServer);

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  await initUserCache();

  httpServer.listen(port, () => {
    console.log(`OTCFlow API listening on http://localhost:${port}`);
    console.log(`Deal events WebSocket: ws://localhost:${port}/ws/deals`);
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
