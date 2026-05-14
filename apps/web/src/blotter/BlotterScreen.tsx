import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { DealStatus } from '@otcflow/shared';
import { fetchDeals, patchDealStatus } from '../api/dealsClient.js';
import { BlotterToolbar } from './BlotterToolbar.js';
import { BlotterToolbarProvider } from './BlotterToolbarProvider.js';
import type { BlotterToolbarContextValue } from './blotterToolbarContext.js';
import { CreateDealForm } from './CreateDealForm.js';
import { DealTable } from './DealTable.js';
import { DealDetailPanel } from './DealDetailPanel.js';
import { dealQueryKeys } from './queryKeys.js';
import { useBlotterView } from './useBlotterView.js';
import { useDealEventsWebSocket } from './useDealEventsWebSocket.js';
import './blotter.css';

export function BlotterScreen() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useDealEventsWebSocket();

  const dealsQuery = useQuery({
    queryKey: dealQueryKeys.all,
    queryFn: fetchDeals,
  });

  const allDeals = dealsQuery.data ?? [];

  const patchStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DealStatus }) => patchDealStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealQueryKeys.all });
    },
  });

  const view = useBlotterView(allDeals);

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

  const selectedId = view.selectedId;
  const selectedDeal = view.selectedDeal;

  const isStatusUpdating =
    patchStatusMutation.isPending &&
    patchStatusMutation.variables !== undefined &&
    selectedDeal !== null &&
    patchStatusMutation.variables.id === selectedDeal.id;

  const statusError =
    patchStatusMutation.isError &&
    patchStatusMutation.variables !== undefined &&
    selectedDeal !== null &&
    patchStatusMutation.variables.id === selectedDeal.id
      ? patchStatusMutation.error instanceof Error
        ? patchStatusMutation.error.message
        : 'Status update failed'
      : null;

  const handleStatusChange = (status: DealStatus) => {
    if (!selectedDeal) return;
    patchStatusMutation.mutate({ id: selectedDeal.id, status });
  };

  return (
    <div className="blotter-app">
      <header className="blotter-header">
        <div className="blotter-header__row">
          <div>
            <h1 className="blotter-header__title">OTCFlow</h1>
            <p className="blotter-header__subtitle">OTC deal blotter · REST + realtime (Phase 4)</p>
          </div>
          <button
            type="button"
            className="blotter-btn blotter-btn--ghost"
            onClick={() => setShowCreateForm((previous) => !previous)}
            disabled={dealsQuery.isPending}
          >
            {showCreateForm ? 'Hide form' : 'New deal'}
          </button>
        </div>
      </header>

      {dealsQuery.isPending ? (
        <div className="blotter-loading" role="status" aria-live="polite">
          <p>Loading deals…</p>
        </div>
      ) : dealsQuery.isError ? (
        <div className="blotter-error-panel" role="alert">
          <p className="blotter-error-panel__title">Could not load deals</p>
          <p className="blotter-error-panel__detail">
            {dealsQuery.error instanceof Error ? dealsQuery.error.message : 'Unknown error'}
          </p>
          <button type="button" className="blotter-btn blotter-btn--primary" onClick={() => void dealsQuery.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {dealsQuery.isFetching ? (
            <div className="blotter-banner blotter-banner--info" aria-live="polite">
              Refreshing…
            </div>
          ) : null}

          <BlotterToolbarProvider value={toolbarContextValue}>
            <BlotterToolbar />
          </BlotterToolbarProvider>

          {showCreateForm ? (
            <div className="blotter-create-panel">
              <CreateDealForm onCreated={() => setShowCreateForm(false)} />
            </div>
          ) : null}

          <div className="blotter-body">
            <main className="blotter-main">
              <DealTable deals={view.visibleDeals} selectedId={selectedId} onSelect={view.selectDeal} />
            </main>
            {selectedDeal ? (
              <DealDetailPanel
                deal={selectedDeal}
                onClose={view.clearSelection}
                onStatusChange={handleStatusChange}
                isStatusUpdating={isStatusUpdating}
                statusError={statusError}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
