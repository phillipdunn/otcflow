import type { Request } from 'express';
import type { User } from '@otcflow/shared';
import { getDefaultUser, getUserById } from '../data/user.store.js';

export const USER_ID_HEADER = 'x-user-id';

/** Resolve acting user from `x-user-id` (demo only — no authentication yet). */
export function resolveRequestUser(req: Request): User {
  const raw = req.header(USER_ID_HEADER);
  if (typeof raw === 'string' && raw.trim() !== '') {
    const found = getUserById(raw.trim());
    if (found) return found;
  }
  return getDefaultUser();
}
