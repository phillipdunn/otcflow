import type { User } from '@otcflow/shared';
import {
  getFallbackDefaultUser,
  listUsersFromDb,
  seedUsersIfEmpty,
} from '../repositories/user.repository.js';
import { SIMULATOR_SYSTEM_USER } from '@otcflow/shared';

const usersById = new Map<string, User>();

/** Load users from Postgres into an in-memory cache (demo header resolution). */
export async function initUserCache(): Promise<void> {
  await seedUsersIfEmpty();
  const users = await listUsersFromDb();
  usersById.clear();
  for (const user of users) {
    usersById.set(user.id, user);
  }
}

export function getUserById(id: string): User | undefined {
  return usersById.get(id);
}

export function getDefaultUser(): User {
  return usersById.get(getFallbackDefaultUser().id) ?? getFallbackDefaultUser();
}

export function listUsers(): User[] {
  return [...usersById.values()].filter((u) => u.id !== SIMULATOR_SYSTEM_USER.id);
}

export function getSimulatorUser(): User {
  return usersById.get(SIMULATOR_SYSTEM_USER.id) ?? SIMULATOR_SYSTEM_USER;
}
