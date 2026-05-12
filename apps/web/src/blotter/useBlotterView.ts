import { useCallback, useMemo, useState } from 'react';
import type { Deal, DealStatus } from '@otcflow/shared';

export type BlotterSortField = 'notional' | 'updatedAt';
export type BlotterSortDirection = 'asc' | 'desc';

export interface BlotterViewState {
  counterpartyQuery: string;
  setCounterpartyQuery: (value: string) => void;
  productFilter: string;
  setProductFilter: (value: string) => void;
  statusFilter: DealStatus | '';
  setStatusFilter: (value: DealStatus | '') => void;
  sortField: BlotterSortField;
  sortDirection: BlotterSortDirection;
  setSort: (field: BlotterSortField) => void;
  selectedId: string | null;
  selectDeal: (id: string | null) => void;
  clearSelection: () => void;
  productOptions: string[];
  visibleDeals: Deal[];
  selectedDeal: Deal | null;
}

export function useBlotterView(allDeals: Deal[]): BlotterViewState {
  const [counterpartyQuery, setCounterpartyQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | ''>('');
  const [sortField, setSortField] = useState<BlotterSortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<BlotterSortDirection>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const productOptions = useMemo(
    () =>
      [...new Set(allDeals.map((deal) => deal.product))].sort((left, right) =>
        left.localeCompare(right)
      ),
    [allDeals]
  );

  const visibleDeals = useMemo(() => {
    const counterpartySearchLower = counterpartyQuery.trim().toLowerCase();

    let filteredRows = allDeals.filter((deal) => {
      if (
        counterpartySearchLower &&
        !deal.counterparty.toLowerCase().includes(counterpartySearchLower)
      ) {
        return false;
      }
      if (productFilter && deal.product !== productFilter) return false;
      if (statusFilter && deal.status !== statusFilter) return false;
      return true;
    });

    filteredRows = [...filteredRows].sort((leftDeal, rightDeal) => {
      if (sortField === 'notional') {
        const notionalComparison = leftDeal.notional - rightDeal.notional;
        return sortDirection === 'asc' ? notionalComparison : -notionalComparison;
      }
      const leftUpdatedMs = Date.parse(leftDeal.updatedAt);
      const rightUpdatedMs = Date.parse(rightDeal.updatedAt);
      const updatedAtComparison = leftUpdatedMs - rightUpdatedMs;
      return sortDirection === 'asc' ? updatedAtComparison : -updatedAtComparison;
    });

    return filteredRows;
  }, [allDeals, counterpartyQuery, productFilter, statusFilter, sortField, sortDirection]);

  const selectedDeal = useMemo(() => {
    if (!selectedId) return null;
    return allDeals.find((deal) => deal.id === selectedId) ?? null;
  }, [allDeals, selectedId]);

  const setSort = (field: BlotterSortField) => {
    if (field === sortField) {
      setSortDirection((previousDirection) => (previousDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'updatedAt' ? 'desc' : 'desc');
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  return {
    counterpartyQuery,
    setCounterpartyQuery,
    productFilter,
    setProductFilter,
    statusFilter,
    setStatusFilter,
    sortField,
    sortDirection,
    setSort,
    selectedId,
    selectDeal: setSelectedId,
    clearSelection,
    productOptions,
    visibleDeals,
    selectedDeal,
  };
}
