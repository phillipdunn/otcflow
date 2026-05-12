import { createContext, useContext } from 'react';
import type { DealStatus } from '@otcflow/shared';
import type { BlotterSortDirection, BlotterSortField } from './useBlotterView.js';

export interface BlotterToolbarContextValue {
  counterpartyQuery: string;
  setCounterpartyQuery: (value: string) => void;
  productFilter: string;
  setProductFilter: (value: string) => void;
  statusFilter: DealStatus | '';
  setStatusFilter: (value: DealStatus | '') => void;
  productOptions: string[];
  sortField: BlotterSortField;
  sortDirection: BlotterSortDirection;
  setSort: (field: BlotterSortField) => void;
  resultCount: number;
}

export const BlotterToolbarContext = createContext<BlotterToolbarContextValue | null>(null);

export function useBlotterToolbar(): BlotterToolbarContextValue {
  const context = useContext(BlotterToolbarContext);
  if (!context) {
    throw new Error('useBlotterToolbar must be used within BlotterToolbarProvider');
  }
  return context;
}
