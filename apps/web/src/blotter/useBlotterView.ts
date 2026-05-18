import { useCallback, useMemo, useState } from 'react';
import type { Deal, DealStatus } from '@otcflow/shared';

export type BlotterSortField = 'createdAt' | 'notional' | 'updatedAt';
export type BlotterSortDirection = 'asc' | 'desc';

export interface BlotterViewState {
  /** Single needle matched (substring, case-insensitive) against counterparty, trader, and broker. */
  searchQuery: string;
  setSearchQuery: (value: string) => void;
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

function rowMatchesSearch(deal: Deal, needleLower: string): boolean {
  if (!needleLower) return true;
  return [deal.counterparty, deal.trader, deal.broker].some((field) =>
    field.toLowerCase().includes(needleLower)
  );
}

export function useBlotterView(allDeals: Deal[]): BlotterViewState {
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | ''>('');
  /** `createdAt` default — stable scroll while simulator updates `updatedAt` on other rows. */
  const [sortField, setSortField] = useState<BlotterSortField>('createdAt');
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
    const needle = searchQuery.trim().toLowerCase();

    let filteredRows = allDeals.filter((deal) => {
      if (!rowMatchesSearch(deal, needle)) return false;
      if (productFilter && deal.product !== productFilter) return false;
      if (statusFilter && deal.status !== statusFilter) return false;
      return true;
    });

    filteredRows = [...filteredRows].sort((leftDeal, rightDeal) => {
      if (sortField === 'notional') {
        const notionalComparison = leftDeal.notional - rightDeal.notional;
        return sortDirection === 'asc' ? notionalComparison : -notionalComparison;
      }
      const timeField = sortField === 'updatedAt' ? 'updatedAt' : 'createdAt';
      const leftMs = Date.parse(leftDeal[timeField]);
      const rightMs = Date.parse(rightDeal[timeField]);
      const timeComparison = leftMs - rightMs;
      return sortDirection === 'asc' ? timeComparison : -timeComparison;
    });

    return filteredRows;
  }, [allDeals, searchQuery, productFilter, statusFilter, sortField, sortDirection]);

  const selectedDeal = useMemo(() => {
    if (!selectedId) return null;
    return allDeals.find((deal) => deal.id === selectedId) ?? null;
  }, [allDeals, selectedId]);

  const setSort = (field: BlotterSortField) => {
    if (field === sortField) {
      setSortDirection((previousDirection) => (previousDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
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
