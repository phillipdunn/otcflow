import type { Server } from 'node:http';
import type { DealEvent } from '@otcflow/shared';
import { DealEventSchema } from '@otcflow/shared';
import { WebSocketServer, WebSocket as WsSocket } from 'ws';

const clients = new Set<WsSocket>();

/**
 * Attach a WebSocket server on the same HTTP port as Express, path `/ws/deals`.
 * Clients receive JSON lines matching DealEventSchema (DEAL_CREATED, DEAL_STATUS_CHANGED).
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

/** Broadcast a validated event to all connected browsers. */
export function broadcastDealEvent(event: DealEvent): void {
  const payload = DealEventSchema.parse(event);
  const message = JSON.stringify(payload);
  for (const socket of clients) {
    if (socket.readyState === WsSocket.OPEN) {
      socket.send(message);
    }
  }
}
