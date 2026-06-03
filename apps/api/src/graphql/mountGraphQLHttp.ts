import type { Express, Request } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { graphQLSchema } from './schema.js';
import type { GraphQLContext } from './context.js';

/** Mount POST/GET `/graphql` for queries and mutations (additive to REST). */
export function mountGraphQLHttp(app: Express): void {
  app.all(
    '/graphql',
    createHandler<GraphQLContext>({
      schema: graphQLSchema,
      context: (req): GraphQLContext => {
        const expressReq = req.raw as Request;
        return { currentUser: expressReq.currentUser };
      },
    })
  );
}
