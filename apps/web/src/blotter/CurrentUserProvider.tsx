import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_MOCK_USER_ID, MOCK_USERS, type User } from '@otcflow/shared';
import { registerCurrentUserIdProvider, unregisterCurrentUserIdProvider } from '../api/requestUserHeader.js';
import { CurrentUserContext } from './currentUserContext.js';

function findUserById(id: string): User {
  return MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS.find((u) => u.id === DEFAULT_MOCK_USER_ID)!;
}

export interface CurrentUserProviderProps {
  children: ReactNode;
}

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_MOCK_USER_ID);
  const currentUser = useMemo(() => findUserById(currentUserId), [currentUserId]);

  useEffect(() => {
    registerCurrentUserIdProvider(() => currentUserId);
    return () => unregisterCurrentUserIdProvider();
  }, [currentUserId]);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUserId,
      users: MOCK_USERS,
    }),
    [currentUser, setCurrentUserId]
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}
