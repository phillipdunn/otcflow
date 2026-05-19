import { DEFAULT_MOCK_USER_ID, MOCK_USERS, SIMULATOR_SYSTEM_USER, type User } from '@otcflow/shared';
import { prisma } from '../db/prisma.js';
import { toUser } from '../db/mappers.js';

const SEED_USERS: User[] = [...MOCK_USERS, SIMULATOR_SYSTEM_USER];

export async function seedUsersIfEmpty(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;

  await prisma.user.createMany({
    data: SEED_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
    })),
  });
}

export async function listUsersFromDb(): Promise<User[]> {
  const rows = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  return rows.map(toUser);
}

export async function findUserByIdFromDb(id: string): Promise<User | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : undefined;
}

export function getFallbackDefaultUser(): User {
  return MOCK_USERS.find((u) => u.id === DEFAULT_MOCK_USER_ID) ?? MOCK_USERS[0];
}
