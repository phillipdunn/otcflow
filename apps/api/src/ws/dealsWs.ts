import type { Server } from 'node:http';
import type { DomainDealEvent } from '@otcflow/shared';
import { DealEventSchema } from '@otcflow/shared';
import { WebSocketServer, WebSocket as WsSocket } from 'ws';
import { logger } from '../observability/logger.js';

const clients = new Set<WsSocket>();

let nextSequenceNumber = 0;

/** Reset global stream counter (e.g. after simulator data reset). */
export function resetDealEventSequence(counter = 0): void {
  nextSequenceNumber = counter;
}

export function getLastDealEventSequence(): number {
  return nextSequenceNumber;
}

export function getActiveDealWebSocketClients(): number {
  return clients.size;
}

/**
 * Attach a WebSocket server on the same HTTP port as Express, path `/ws/deals`.
 * Clients receive JSON matching DealEventSchema (with monotonic sequenceNumber).
 */
export function attachDealsWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/deals' });

  wss.on('connection', (socket) => {
    clients.add(socket);
    logger.info('deals_websocket_client_connected', { activeClients: clients.size });

    socket.on('close', () => {
      clients.delete(socket);
      logger.info('deals_websocket_client_disconnected', { activeClients: clients.size });
    });
  });

  return wss;
}

type DealEventInput = Omit<ReturnType<typeof DealEventSchema.parse>, 'sequenceNumber'> & {
  sequenceNumber?: number;
};

/**
 * Push a deal event to all connected WebSocket clients.
 * Called by the event-bus → WebSocket bridge after sequenceNumber assignment.
 */
export function broadcastDealEventToClients(event: DomainDealEvent | DealEventInput): ReturnType<
  typeof DealEventSchema.parse
> {
  const sequenceNumber =
    'sequenceNumber' in event && event.sequenceNumber !== undefined
      ? event.sequenceNumber
      : ++nextSequenceNumber;
  const payload = DealEventSchema.parse({ ...event, sequenceNumber });
  const message = JSON.stringify(payload);
  for (const socket of clients) {
    if (socket.readyState === WsSocket.OPEN) {
      socket.send(message);
    }
  }
  return payload;
}
