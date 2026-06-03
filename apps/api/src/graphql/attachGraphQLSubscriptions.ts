import type { Server } from 'node:http';
import type { GraphQLSchema } from 'graphql';
import { useServer, type Extra } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { graphQLSchema } from './schema.js';
import { resolveGraphQLUser } from './context.js';
import { logger } from '../observability/logger.js';
import {
  onGraphQLSubscriptionClientConnected,
  onGraphQLSubscriptionClientDisconnected,
} from './graphqlWsMetrics.js';

/**
 * GraphQL subscriptions over WebSocket at `ws://host/graphql` (graphql-ws protocol).
 * REST blotter clients keep using `/ws/deals`; this path is for GraphQL subscribers.
 */
export function attachGraphQLSubscriptions(
  httpServer: Server,
  schema: GraphQLSchema = graphQLSchema
): WebSocketServer {
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  wsServer.on('connection', (socket) => {
    onGraphQLSubscriptionClientConnected();
    logger.info('graphql_subscription_client_connected', {
      activeClients: wsServer.clients.size,
    });
    socket.on('close', () => {
      onGraphQLSubscriptionClientDisconnected();
      logger.info('graphql_subscription_client_disconnected', {
        activeClients: wsServer.clients.size,
      });
    });
  });

  useServer(
    {
      schema,
      context: (ctx: { extra: Extra; connectionParams?: Record<string, unknown> }) => {
        const headerUser = ctx.extra.request.headers['x-user-id'];
        const paramUser = ctx.connectionParams?.['x-user-id'];
        const raw =
          typeof paramUser === 'string'
            ? paramUser
            : typeof headerUser === 'string'
              ? headerUser
              : undefined;
        return { currentUser: resolveGraphQLUser(raw) };
      },
    },
    wsServer
  );

  return wsServer;
}
