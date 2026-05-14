import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { DealStatus } from '@otcflow/shared';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { fetchDeals, patchDealStatus } from '../api/dealsClient.js';
import { BlotterToolbar } from './BlotterToolbar.js';
import { BlotterToolbarProvider } from './BlotterToolbarProvider.js';
import type { BlotterToolbarContextValue } from './blotterToolbarContext.js';
import { CreateDealForm } from './CreateDealForm.js';
import { DealBlotterGrid } from './grid/index.js';
import { DealDetailPanel } from './DealDetailPanel.js';
import { dealQueryKeys } from './queryKeys.js';
import { useBlotterView } from './useBlotterView.js';
import { useDealEventsWebSocket } from './useDealEventsWebSocket.js';
import { blotterChrome } from '../blotterTheme.js';

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
      searchQuery: view.searchQuery,
      setSearchQuery: view.setSearchQuery,
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
      view.searchQuery,
      view.setSearchQuery,
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h1" sx={{ color: 'inherit' }}>
              OTCFlow
            </Typography>
            <Typography variant="caption" sx={{ color: blotterChrome.headerMuted, display: 'block', mt: 0.25 }}>
              OTC trade blotter · REST + TanStack Query + realtime (Phase 5: MUI + AG Grid)
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="medium"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
            disabled={dealsQuery.isPending}
            disableElevation
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: blotterChrome.headerCtaBg,
              color: blotterChrome.headerCtaText,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.22)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              '&:hover': {
                bgcolor: blotterChrome.headerCtaHoverBg,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
              },
              '&:disabled': {
                bgcolor: 'rgba(248, 250, 252, 0.55)',
                color: 'rgba(15, 23, 42, 0.42)',
                borderColor: 'rgba(226, 232, 240, 0.5)',
              },
            }}
          >
            New trade
          </Button>
        </Toolbar>
      </AppBar>

      {dealsQuery.isFetching && !dealsQuery.isPending ? <LinearProgress sx={{ height: 2 }} /> : null}

      {dealsQuery.isPending ? (
        <Box sx={{ p: 4, textAlign: 'center' }} role="status" aria-live="polite">
          <Typography>Loading trades…</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Box>
      ) : dealsQuery.isError ? (
        <Box sx={{ p: 2 }} role="alert">
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void dealsQuery.refetch()}>
                Retry
              </Button>
            }
          >
            Could not load trades —{' '}
            {dealsQuery.error instanceof Error ? dealsQuery.error.message : 'Unknown error'}
          </Alert>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <BlotterToolbarProvider value={toolbarContextValue}>
            <BlotterToolbar />
          </BlotterToolbarProvider>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', px: 0, pb: 0 }}>
            <DealBlotterGrid
              deals={view.visibleDeals}
              selectedId={view.selectedId}
              onSelectDeal={(id) => view.selectDeal(id)}
            />
            {view.visibleDeals.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                No trades match the current filters.
              </Typography>
            ) : null}
          </Box>
        </Box>
      )}

      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="create-trade-dialog-title"
      >
        <DialogTitle id="create-trade-dialog-title" sx={{ pr: 6 }}>
          New trade
          <IconButton
            aria-label="Close"
            onClick={() => setShowCreateForm(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <CreateDealForm
            onCreated={() => {
              setShowCreateForm(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <DealDetailPanel
        deal={selectedDeal}
        open={selectedDeal !== null}
        onClose={view.clearSelection}
        onStatusChange={handleStatusChange}
        isStatusUpdating={isStatusUpdating}
        statusError={statusError}
      />
    </Box>
  );
}
