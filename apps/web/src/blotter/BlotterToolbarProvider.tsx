import type { ReactNode } from 'react';
import { BlotterToolbarContext, type BlotterToolbarContextValue } from './blotterToolbarContext.js';

export function BlotterToolbarProvider({
  value,
  children,
}: {
  value: BlotterToolbarContextValue;
  children: ReactNode;
}) {
  return <BlotterToolbarContext.Provider value={value}>{children}</BlotterToolbarContext.Provider>;
}
