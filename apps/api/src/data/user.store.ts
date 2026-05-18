import { DEFAULT_MOCK_USER_ID, MOCK_USERS, SIMULATOR_SYSTEM_USER, type User } from '@otcflow/shared';

const usersById = new Map<string, User>(MOCK_USERS.map((user) => [user.id, user]));

export function getUserById(id: string): User | undefined {
  return usersById.get(id);
}

export function getDefaultUser(): User {
  return usersById.get(DEFAULT_MOCK_USER_ID) ?? MOCK_USERS[0];
}

export function listUsers(): User[] {
  return [...MOCK_USERS];
}

export function getSimulatorUser(): User {
  return SIMULATOR_SYSTEM_USER;
}
