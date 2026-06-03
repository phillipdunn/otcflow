import type { User } from '@otcflow/shared';
import { getDefaultUser, getUserById } from '../data/user.store.js';

/** GraphQL request context — acting user for mutations (same demo header as REST). */
export type GraphQLContext = Record<PropertyKey, unknown> & {
  currentUser: User;
};

/** Resolve acting user from `x-user-id` header or GraphQL WS connectionParams. */
export function resolveGraphQLUser(userIdHeader: string | undefined | null): User {
  if (typeof userIdHeader === 'string' && userIdHeader.trim() !== '') {
    const found = getUserById(userIdHeader.trim());
    if (found) return found;
  }
  return getDefaultUser();
}
