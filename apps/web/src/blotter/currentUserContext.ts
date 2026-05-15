import { createContext, useContext } from 'react';
import type { User } from '@otcflow/shared';

export interface CurrentUserContextValue {
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  users: User[];
}

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return context;
}
