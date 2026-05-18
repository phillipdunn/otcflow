import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  fetchSimulatorStatus,
  resetSimulatorData,
  startSimulator,
  stopSimulator,
} from '../api/simulatorClient.js';
import { dealQueryKeys, simulatorQueryKeys } from './queryKeys.js';

export function BlotterSimulatorControls() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: simulatorQueryKeys.status,
    queryFn: fetchSimulatorStatus,
    refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
  });

  const invalidateBlotter = () => {
    void queryClient.invalidateQueries({ queryKey: dealQueryKeys.all });
    void queryClient.removeQueries({ queryKey: ['deals'], predicate: (q) => q.queryKey.length === 3 });
  };

  const startMutation = useMutation({
    mutationFn: () => startSimulator(),
    onSuccess: (data) => {
      queryClient.setQueryData(simulatorQueryKeys.status, data);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => stopSimulator(),
    onSuccess: (data) => {
      queryClient.setQueryData(simulatorQueryKeys.status, data);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetSimulatorData(),
    onSuccess: (data) => {
      queryClient.setQueryData(simulatorQueryKeys.status, data);
      invalidateBlotter();
    },
  });

  const status = statusQuery.data;
  const busy = startMutation.isPending || stopMutation.isPending || resetMutation.isPending;
  const error =
    startMutation.error ?? stopMutation.error ?? resetMutation.error ?? statusQuery.error ?? null;

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={1}
      useFlexGap
      sx={{ alignItems: { lg: 'center' }, flexWrap: 'wrap' }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
        Simulator
      </Typography>
      <Button
        size="small"
        variant="contained"
        color="success"
        disabled={busy || status?.running === true}
        onClick={() => startMutation.mutate()}
      >
        Start
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={busy || status?.running !== true}
        onClick={() => stopMutation.mutate()}
      >
        Stop
      </Button>
      <Button size="small" variant="outlined" color="warning" disabled={busy} onClick={() => resetMutation.mutate()}>
        Reset data
      </Button>
      {status ? (
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            size="small"
            label={status.running ? 'Running' : 'Stopped'}
            color={status.running ? 'success' : 'default'}
            variant={status.running ? 'filled' : 'outlined'}
          />
          <Typography variant="caption" color="text.secondary" component="span">
            {status.dealCount.toLocaleString()} deals · {status.eventsEmitted.toLocaleString()} events · seq{' '}
            {status.lastSequenceNumber}
          </Typography>
        </Stack>
      ) : statusQuery.isPending ? (
        <Typography variant="caption" color="text.secondary">
          Loading status…
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" variant="outlined" sx={{ py: 0, px: 1 }}>
          {error instanceof Error ? error.message : 'Simulator request failed'}
        </Alert>
      ) : null}
    </Stack>
  );
}
