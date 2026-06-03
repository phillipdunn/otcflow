import { makeExecutableSchema } from '@graphql-tools/schema';
import type { IResolvers } from '@graphql-tools/utils';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';

export const graphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers: resolvers as IResolvers,
});
