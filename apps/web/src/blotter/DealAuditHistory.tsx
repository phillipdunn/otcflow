import { useQuery } from '@tanstack/react-query';
import type { AuditEvent } from '@otcflow/shared';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchDealAuditEvents } from '../api/dealsClient.js';
import { dealQueryKeys } from './queryKeys.js';
import { formatAuditEventType } from './formatAuditEventType.js';
import { formatDealUpdatedAtDetail } from './formatDealDisplay.js';
import { formatUserRole } from './formatUserRole.js';

function AuditEventCard({ event }: { event: AuditEvent }) {
  return (
    <Box
      component="article"
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.25,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
          {formatAuditEventType(event.type)}
        </Typography>
        <Chip label={`v${event.version}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {formatDealUpdatedAtDetail(event.timestamp)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {event.user.name} · {formatUserRole(event.user.role)}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {event.summary}
      </Typography>
      {event.previousValue != null || event.newValue != null ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}
        >
          {event.previousValue ?? '—'} → {event.newValue ?? '—'}
        </Typography>
      ) : null}
    </Box>
  );
}

export interface DealAuditHistoryProps {
  dealId: string;
  enabled: boolean;
}

export function DealAuditHistory({ dealId, enabled }: DealAuditHistoryProps) {
  const auditQuery = useQuery({
    queryKey: dealQueryKeys.auditEvents(dealId),
    queryFn: () => fetchDealAuditEvents(dealId),
    enabled,
  });

  if (auditQuery.isPending) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 1 }}>
        <CircularProgress size={20} aria-label="Loading audit history" />
        <Typography variant="body2" color="text.secondary">
          Loading audit history…
        </Typography>
      </Stack>
    );
  }

  if (auditQuery.isError) {
    return (
      <Alert severity="error" variant="outlined">
        {auditQuery.error instanceof Error ? auditQuery.error.message : 'Could not load audit history'}
      </Alert>
    );
  }

  const events = auditQuery.data ?? [];
  if (events.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No audit events for this trade.
      </Typography>
    );
  }

  return (
    <Stack component="ul" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {events.map((event) => (
        <Box component="li" key={event.id}>
          <AuditEventCard event={event} />
        </Box>
      ))}
    </Stack>
  );
}
