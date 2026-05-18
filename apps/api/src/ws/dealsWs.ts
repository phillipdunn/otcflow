import type { Server } from 'node:http';
import type { DealEvent } from '@otcflow/shared';
import { DealEventSchema } from '@otcflow/shared';
import { WebSocketServer, WebSocket as WsSocket } from 'ws';

const clients = new Set<WsSocket>();

let nextSequenceNumber = 0;

/** Reset global stream counter (e.g. after simulator data reset). */
export function resetDealEventSequence(counter = 0): void {
  nextSequenceNumber = counter;
}

export function getLastDealEventSequence(): number {
  return nextSequenceNumber;
}

/**
 * Attach a WebSocket server on the same HTTP port as Express, path `/ws/deals`.
 * Clients receive JSON matching DealEventSchema (with monotonic sequenceNumber).
 */
export function attachDealsWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/deals' });

  wss.on('connection', (socket) => {
    clients.add(socket);
    socket.on('close', () => {
      clients.delete(socket);
    });
  });

  return wss;
}

type DealEventInput = Omit<DealEvent, 'sequenceNumber'> & { sequenceNumber?: number };

/** Broadcast a validated event to all connected browsers. Assigns sequenceNumber if omitted. */
export function broadcastDealEvent(event: DealEventInput): DealEvent {
  const sequenceNumber = event.sequenceNumber ?? ++nextSequenceNumber;
  const payload = DealEventSchema.parse({ ...event, sequenceNumber });
  const message = JSON.stringify(payload);
  for (const socket of clients) {
    if (socket.readyState === WsSocket.OPEN) {
      socket.send(message);
    }
  }
  return payload;
}
