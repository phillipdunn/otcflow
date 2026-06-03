import type { Server } from 'node:http';
import type { WebSocketServer } from 'ws';
import { logger } from './logger.js';
import { stopSimulator } from '../services/simulator.service.js';
import { prisma } from '../db/prisma.js';

export interface ShutdownTargets {
  httpServer: Server;
  dealsWss?: WebSocketServer;
  graphQLWss?: WebSocketServer;
}

let shuttingDown = false;

async function closeWebSocketServer(wss: WebSocketServer, label: string): Promise<void> {
  for (const client of wss.clients) {
    client.close(1001, 'Server shutting down');
  }
  await new Promise<void>((resolve, reject) => {
    wss.close((err) => {
      if (err) reject(err);
      else {
        logger.info(`${label}_closed`);
        resolve();
      }
    });
  });
}

async function runShutdown(targets: ShutdownTargets): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info('shutdown_started');

  try {
    await stopSimulator();
    logger.info('simulator_stopped');
  } catch (err) {
    logger.error('simulator_stop_failed', { error: String(err) });
  }

  if (targets.dealsWss) {
    try {
      await closeWebSocketServer(targets.dealsWss, 'deals_websocket');
    } catch (err) {
      logger.error('deals_websocket_close_failed', { error: String(err) });
    }
  }

  if (targets.graphQLWss) {
    try {
      await closeWebSocketServer(targets.graphQLWss, 'graphql_websocket');
    } catch (err) {
      logger.error('graphql_websocket_close_failed', { error: String(err) });
    }
  }

  await new Promise<void>((resolve, reject) => {
    targets.httpServer.close((err) => {
      if (err) reject(err);
      else {
        logger.info('http_server_closed');
        resolve();
      }
    });
  });

  await prisma.$disconnect();
  logger.info('database_disconnected');

  logger.info('shutdown_complete');
}

export function registerGracefulShutdown(targets: ShutdownTargets): void {
  const signalHandler = (signal: string) => {
    logger.info('shutdown_signal_received', { signal });
    void runShutdown(targets)
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error('shutdown_failed', { error: String(err) });
        process.exit(1);
      });
  };

  process.once('SIGINT', () => signalHandler('SIGINT'));
  process.once('SIGTERM', () => signalHandler('SIGTERM'));
}

export function registerProcessErrorHandlers(): void {
  process.on('uncaughtException', (err) => {
    logger.error('uncaught_exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', {
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
