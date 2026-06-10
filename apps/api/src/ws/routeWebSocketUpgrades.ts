import type { Server } from 'node:http';
import type { WebSocketServer } from 'ws';

export interface WebSocketUpgradeRoutes {
  '/ws/deals': WebSocketServer;
  '/graphql': WebSocketServer;
}

/**
 * Route HTTP upgrade requests to the correct WebSocket server.
 * Required when multiple `ws` servers share one HTTP listener — attaching each
 * with `{ server }` causes conflicting upgrade handlers and broken frames.
 */
export function routeWebSocketUpgrades(httpServer: Server, routes: WebSocketUpgradeRoutes): void {
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const wss =
      pathname === '/ws/deals'
        ? routes['/ws/deals']
        : pathname === '/graphql'
          ? routes['/graphql']
          : undefined;

    if (!wss) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}
