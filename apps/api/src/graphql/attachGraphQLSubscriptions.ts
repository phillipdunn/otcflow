import type { Server } from 'node:http';
import type { GraphQLSchema } from 'graphql';
import { useServer, type Extra } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { graphQLSchema } from './schema.js';
import { resolveGraphQLUser } from './context.js';

/**
 * GraphQL subscriptions over WebSocket at `ws://host/graphql` (graphql-ws protocol).
 * REST blotter clients keep using `/ws/deals`; this path is for GraphQL subscribers.
 */
export function attachGraphQLSubscriptions(
  httpServer: Server,
  schema: GraphQLSchema = graphQLSchema
): void {
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

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
}
