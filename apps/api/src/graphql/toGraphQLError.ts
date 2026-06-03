import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';
import { HttpError } from '../middleware/error.middleware.js';

export function toGraphQLError(err: unknown): never {
  if (err instanceof HttpError) {
    throw new GraphQLError(err.message, {
      extensions: {
        code: err.statusCode === 404 ? 'NOT_FOUND' : 'BAD_USER_INPUT',
        http: { status: err.statusCode },
      },
    });
  }
  if (err instanceof ZodError) {
    throw new GraphQLError('Validation failed', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  throw err;
}
