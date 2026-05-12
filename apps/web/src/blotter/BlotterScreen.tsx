import { useMemo } from 'react';
import { MOCK_DEALS } from './mockDeals.js';
import { BlotterToolbar } from './BlotterToolbar.js';
import { BlotterToolbarProvider } from './BlotterToolbarProvider.js';
import type { BlotterToolbarContextValue } from './blotterToolbarContext.js';
import { DealTable } from './DealTable.js';
import { DealDetailPanel } from './DealDetailPanel.js';
import { useBlotterView } from './useBlotterView.js';
import './blotter.css';

export function BlotterScreen() {
  const view = useBlotterView(MOCK_DEALS);

  const toolbarContextValue = useMemo<BlotterToolbarContextValue>(
    () => ({
      counterpartyQuery: view.counterpartyQuery,
      setCounterpartyQuery: view.setCounterpartyQuery,
      productFilter: view.productFilter,
      setProductFilter: view.setProductFilter,
      statusFilter: view.statusFilter,
      setStatusFilter: view.setStatusFilter,
      productOptions: view.productOptions,
      sortField: view.sortField,
      sortDirection: view.sortDirection,
      setSort: view.setSort,
      resultCount: view.visibleDeals.length,
    }),
    [
      view.counterpartyQuery,
      view.setCounterpartyQuery,
      view.productFilter,
      view.setProductFilter,
      view.statusFilter,
      view.setStatusFilter,
      view.productOptions,
      view.sortField,
      view.sortDirection,
      view.setSort,
      view.visibleDeals.length,
    ]
  );

  return (
    <div className="blotter-app">
      <header className="blotter-header">
        <div>
          <h1 className="blotter-header__title">OTCFlow</h1>
          <p className="blotter-header__subtitle">OTC deal blotter (mock data · Phase 1)</p>
        </div>
      </header>

      <BlotterToolbarProvider value={toolbarContextValue}>
        <BlotterToolbar />
      </BlotterToolbarProvider>

      <div className="blotter-body">
        <main className="blotter-main">
          <DealTable
            deals={view.visibleDeals}
            selectedId={view.selectedId}
            onSelect={view.selectDeal}
          />
        </main>
        {view.selectedDeal ? (
          <DealDetailPanel deal={view.selectedDeal} onClose={view.clearSelection} />
        ) : null}
      </div>
    </div>
  );
}
